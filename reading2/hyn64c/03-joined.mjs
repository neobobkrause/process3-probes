// ===== file: state-writes.test.mjs (continued) =====

  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => writeFileSync(join(wt, 'a.txt'), 'x'));
  const before = git(['rev-parse', `refs/heads/${SB}`], { cwd: bare });
  let k = 0;
  assert.throws(() => writeState(root, SB, 'ours', (wt) => {
    if (k++ === 0) { writeState(two, SB, 'theirs', (w) => writeFileSync(join(w, 'b.txt'), 'y')); return {}; }
    throw new Error('refused on the fresh tip');
  }), /refused on the fresh tip/);
  assert.notEqual(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), before, 'theirs landed');
  assert.equal(onOrigin(bare, 'b.txt'), 'y');
  assert.equal(git(['show', `${SB}~0:a.txt`], { cwd: bare }), 'x');
  assert.equal(git(['log', '--format=%s', '-1', SB], { cwd: bare }), 'theirs');
});

test('#11: the old BOB\'s prompt refresh after ROOT\'s handover confirm refuses, and bob stays the new BOB', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B1, { log: quiet });
  // The old BOB's record names a prompt this pin no longer prints, so its wake would rewrite it.
  writeState(root, SB, 'old prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: B1, at: '2026-01-01T00:00:00Z', prompt: { hash: '0'.repeat(64) } }) + '\n'));
  assert.equal(readAddress(root).bob.session, B1, 'the old BOB\'s read, kept for the command');
  // ROOT, in its own checkout, confirms the handover.
  const rootSession = other(bare);
  handoverConfirm(rootSession, B2, { log: quiet });
  assert.throws(() => promptRefresh(root, { session: B1, pin: 'f'.repeat(40), log: quiet }), /refused: bob's address moved to session_bob2 while the prompt refresh ran; nothing was changed/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

test('#11: start record and handover confirm refuse an address that moved since their read', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.equal(readAddress(root).root.session, R);
  // Another session records a different ROOT after this command's read.
  recordStart(other(bare), 'root', 'session_root2', { log: quiet });
  assert.throws(() => recordStart(root, 'root', 'session_root3', { log: quiet }), /refused: root's address moved to session_root2 while start record root ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/root.json')).session, 'session_root2');
  // Recording the same id again still works (the address may already name it).
  const fresh = other(bare);
  recordStart(fresh, 'root', 'session_root2', { log: quiet });
  // handover confirm: BOB moved after ROOT's read.
  const r2 = other(bare);
  recordStart(r2, 'bob', B1, { log: quiet });
  assert.equal(readAddress(r2).bob.session, B1);
  handoverConfirm(other(bare), B2, { log: quiet });
  assert.throws(() => handoverConfirm(r2, 'session_bob3', { log: quiet }), /refused: bob's address moved to session_bob2 while handover confirm ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

const io = (head, contents = {}, tracked = []) => ({
  slug: 'o/r',
  read: (_s, n) => ({ number: Number(n), title: 'T', base: { ref: 'tranche' }, head: { ref: head, sha: 'abc1234567890' } }),
  files: () => ['src/alpha/a.mjs'],
  contents: (_s, path) => contents[path] ?? null,
  notes: () => [],
  tracked: (_s, path) => tracked.includes(path),
});

test('#9: a job\'s brief names p3 test <id> as the suite and lists the generated paths as built, not committed', () => {
  const root = makeRepo({ 'README.md': 'x\n', 'process/config.json': { generated: [
    { paths: ['build/rows.mjs', 'dist/big.bundled.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] },
  ] } });
  const text = reviewBrief(root, '7', { log: quiet, io: io('job/alpha', { 'process/ledger/alpha.json': { requirements: 'req/alpha.md' }, 'req/alpha.md': '- **R1** x\n' }, ['dist/big.bundled.mjs']) });
  assert.match(text, /run the module's suite as the gate does: `node \.process\/tool\/p3\.mjs test alpha` from the checkout's root, never a bare `node --test`/);
  assert.match(text, /Built, not committed[^\n]*`build\/rows\.mjs`\./);
  assert.match(text, /Generated and committed[^\n]*`dist\/big\.bundled\.mjs`/);
  assert.doesNotMatch(text, /or the module's own suite/);
  // The process repository's own pull request keeps its suite line.
  const plain = reviewBrief(root, '8', { log: quiet, io: io('build/x') });
  assert.match(plain, /`node --test 'tool\/test\/\*\.test\.mjs'` here/);
  assert.doesNotMatch(plain, /p3\.mjs test/);
});

test('survival: a merge commit missing from a shallow clone is unmeasured, not reverted', () => {
  const root = makeRepo({ 'a.txt': 'x' });
  const merged_at = '2026-01-01T00:00:00Z';
  assert.equal(survival(root, { merge_sha: 'e'.repeat(40), merged_at }, 'main').state, 'unmeasured');
  const off = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '--orphan', 'side'], { cwd: root });
  commit(root, { 'b.txt': 'y' });
  assert.equal(survival(root, { merge_sha: off, merged_at }, 'side').state, 'reverted', 'present but off the branch');
  assert.equal(survival(root, { merge_sha: off, merged_at }, 'main').state, 'survived');
});

test('found: a local found/<module>-f<n> branch not yet pushed takes its number', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | base | q2 |\n',
    'build/requirements/q2.md': '- **R1** met\n',
    'process/config.json': {},
    'process/ledger/q2.json': entry('q2', { requirements: 'build/requirements/q2.md' }),
  });
  openPassed(root);
  git(['branch', 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'one', { offline: true, log: quiet }).mark, 'F1');
  git(['branch', 'found/q2-f1'], { cwd: root }); // the printed act's git switch -c, not pushed
  assert.equal(found(root, 'q2', 'two', { offline: true, log: quiet }).mark, 'F2');
});

// ===== file: switch.test.mjs =====

// Account switch (notes/account-switch-review.md, 5 Nov): switch out's manifest on the state
// branch, switch in's preflight and its restart in order, switch quiet, and the train's lease release.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo } from './helpers.mjs';
import { recordStart } from '../lib/roles.mjs';
import { approvalsHash } from '../lib/start.mjs';
import { fetchState, readState, writeState } from '../lib/state.mjs';
import { MANIFEST_FILE, processTask, productNames, readTasks, switchIn, switchOut, switchQuiet } from '../lib/switch.mjs';
import { git, loadConfig } from '../lib/util.mjs';

const quiet = () => {};
const COORD = 'session_coordold';
const NEW = 'session_coordnew';
const ID = { root: 'session_rootold', bob: 'session_bobold', watcher: 'session_watcherold' };
const APPROVALS = '# CLAUDE\n\n## Standing approvals from Bob\n\nSessions may push.\n';

function product() {
  const root = makeRepo({
    'CLAUDE.md': APPROVALS,
    'process/config.json': { tranche: 'tranche', coordinator: COORD, release_path: ['delta'] },
    'process/ledger/alpha.json': entry('alpha'),
    'process/ledger/beta.json': entry('beta'),
    'process/ledger/delta.json': entry('delta'),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche:refs/heads/job/gamma'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  for (const [r, id] of Object.entries(ID)) recordStart(root, r, id, { log: quiet });
  // Two messages: one delivered (answered), one sent to BOB and never delivered.
  writeState(root, 'process-state', 'messages', (wt) => {
    mkdirSync(join(wt, 'messages'), { recursive: true });
    writeFileSync(join(wt, 'messages', 'root.jsonl'), [
      { at: '2026-11-05T05:40:00Z', row: 'sent', n: 1, to: 'bob', text: 'run status' },
      { at: '2026-11-05T05:40:05Z', row: 'outcome', n: 1, outcome: 'delivered' },
      { at: '2026-11-05T05:43:00Z', row: 'sent', n: 2, to: 'bob', text: 'notice triage 413 first' },
    ].map((r) => JSON.stringify(r) + '\n').join(''));
  });
  return root;
}

const files = (root, { tasks, sessions }) => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-switch-'));
  const t = join(dir, 'tasks.json');
  const s = join(dir, 'sessions.json');
  writeFileSync(t, JSON.stringify(tasks));
  writeFileSync(s, JSON.stringify(sessions));
  return { t, s };
};

const TASKS = { triggers: [
  { id: 'trig_sweep', name: 'sweep', cron_expression: '14 * * * *', enabled: true, persistent_session_id: ID.root, prompt: `Sweep. sweep --session ${ID.root}` },
  { id: 'trig_flow', name: 'hourly flow', cron_expression: '0 * * * *', enabled: true, persistent_session_id: COORD, prompt: `Flow: message BOB ${ID.bob}` },
  { id: 'trig_report', name: 'train report', run_once_at: '2099-11-06T04:50:00Z', enabled: true, persistent_session_id: 'session_someoneelse', prompt: 'merge train report' },
  { id: 'trig_off', name: 'old probe', cron_expression: '0 0 31 12 *', enabled: false, persistent_session_id: COORD, prompt: 'Reply OK' },
] };
const SESSIONS = { data: [
  { id: 'session_jobalpha', title: 'job alpha', session_status: 'running', updated_at: '2026-11-05T05:40:00Z' },
  { id: 'session_jobalpha0', title: 'job alpha', session_status: 'idle', updated_at: '2026-11-05T01:00:00Z' },
  { id: 'session_jobdelta', title: 'job delta', session_status: 'running', updated_at: '2026-11-05T05:41:00Z' },
  { id: 'session_jobeps', title: 'job eps', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobzeta', title: 'job zeta', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobeta', title: 'job eta', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobbeta', title: 'job beta', session_status: 'archived', updated_at: '2026-11-05T05:00:00Z' },
  { id: 'session_jobgamma', title: 'job gamma (restart)', session_status: 'idle', updated_at: '2026-11-05T05:00:00Z' },
  { id: ID.bob, title: 'BOB', session_status: 'running' },
] };
const ROWS = [
  { id: 'alpha', tranche: 'OPEN', branch: 'WORKING', pr: '#445 draft' },
  { id: 'beta', tranche: 'OPEN', branch: 'WORKING', pr: '#444 draft' },
  { id: 'delta', tranche: 'OPEN', branch: 'BLOCKED (a question)', pr: '#290 ready', ahead: 2 },
  { id: 'eps', tranche: 'OPEN', branch: 'BLOCKED (no PR)', ahead: 2 },
  { id: 'zeta', tranche: 'OPEN', branch: 'WORKING', ahead: 4 },
  { id: 'eta', tranche: 'OPEN', branch: 'WORKING', ahead: 1 },
];
const read = () => ({ rows: ROWS });
const account = (perm = { push: true, admin: false }, login = 'acmewidget') => (p) => (p === 'user' ? (login ? { login } : null) : /^repos\//.test(p) ? { permissions: perm } : null);
const okIO = { api: account(), push: () => ({ code: 0, stdout: '', stderr: '' }) };

test('switch out writes the manifest, and only it, and prints the stop acts in order', () => {
  const root = product();
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  const out = [];
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const r = switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: (l) => out.push(l) });
  // One commit on the state branch, holding the manifest alone.
  assert.equal(git(['rev-list', '--count', `${before}..origin/process-state`], { cwd: root }), '1');
  assert.equal(git(['diff', '--name-only', before, 'origin/process-state'], { cwd: root }), MANIFEST_FILE);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  fetchState(root, 'process-state', { fresh: true });
  const m = JSON.parse(readState(root, 'process-state', MANIFEST_FILE));
  assert.deepEqual(m, r.manifest, 'round trip');
  assert.equal(m.by, COORD);
  assert.equal(m.approvals, approvalsHash(root, 'origin/tranche'));
  assert.deepEqual(Object.fromEntries(Object.entries(m.addresses).map(([k, v]) => [k, v.session])), ID);
  // Enabled tasks only, each with its role.
  assert.deepEqual(m.tasks.map((x) => [x.id, x.role]), [['trig_sweep', 'root'], ['trig_flow', 'coordinator'], ['trig_report', 'unknown']]);
  assert.equal(m.tasks[2].run_once_at, '2099-11-06T04:50:00Z');
  // Live jobs: unarchived, newest session per module, with status's branch, PR and state.
  assert.deepEqual(m.jobs.map((j) => [j.module, j.session, j.branch, j.pr, j.state]), [
    ['delta', 'session_jobdelta', 'job/delta', '#290 ready', 'BLOCKED (a question)'],
    ['alpha', 'session_jobalpha', 'job/alpha', '#445 draft', 'WORKING'],
    ['eps', 'session_jobeps', 'job/eps', null, 'BLOCKED (no PR)'],
    ['eta', 'session_jobeta', 'job/eta', null, 'WORKING'],
    ['gamma', 'session_jobgamma', 'job/gamma', null, 'not in the ledger'],
    ['zeta', 'session_jobzeta', 'job/zeta', null, 'WORKING'],
  ]);
  assert.deepEqual(m.messages.map((x) => `${x.from}-${x.n}`), ['root-2']);
  const text = out.join('\n');
  const at = (re) => { const i = out.findIndex((l) => re.test(l)); assert.ok(i >= 0, String(re)); return i; };
  assert.ok(!out.some((l) => /MERGER|merge train/.test(l)), 'no MERGER to stop');
  assert.ok(at(/^1\. Each live job.*push your work in progress/) < at(/^2\. Switch off each task with update_trigger enabled false/));
  assert.match(text, /- job alpha: session_jobalpha \(job\/alpha, PR #445 draft\)/);
  assert.match(text, /- trig_flow hourly flow \(coordinator\)/);
  assert.doesNotMatch(text, /trig_off/);
  assert.doesNotMatch(text, /—/);
});

test('switch out refuses, writing nothing, when GitHub was not read for the live jobs\' pull requests', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const unread = () => ({ rows: ROWS.map((r) => ({ ...r, pr: 'unknown (GitHub not read)' })) });
  assert.throws(() => switchOut(root, { tasks: t, sessions: s, by: COORD, read: unread, log: quiet }), /GitHub was not read for the pull requests of delta, alpha, eps, eta, zeta; nothing was written/);
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root });
  assert.equal(git(['rev-parse', 'origin/process-state'], { cwd: root }), before);
});

test('switch out refuses a task list with more pages, and needs --by, --tasks and --sessions', () => {
  const root = product();
  const { t, s } = files(root, { tasks: { triggers: [], next_cursor: 'abc' }, sessions: SESSIONS });
  assert.throws(() => readTasks(t), /more pages/);
  assert.throws(() => switchOut(root, { tasks: t, sessions: s, by: 'me', read, log: quiet }), /--by <session>/);
  assert.throws(() => switchOut(root, { sessions: s, by: COORD, read, log: quiet }), /--tasks <file>/);
  assert.throws(() => switchOut(root, { tasks: t, by: COORD, read, log: quiet }), /--sessions <file>/);
});

test('switch in, preflight held: the restart\'s acts (a) to (g) in order, tasks bound to the new roles, jobs release first', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const out = [];
  switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  const text = out.join('\n');
  for (const l of ['- ok: GitHub connected, acting as acmewidget', '- ok: account: acmewidget: push true, admin false', '- ok: push reachable on origin (o/p), dry run']) assert.ok(out.includes(l), l);
  assert.match(text, /- ok: approvals at tranche's tip are those switch out recorded/);
  const steps = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'].map((k) => out.findIndex((l) => l.startsWith(k)));
  assert.ok(steps.every((i, k) => i >= 0 && (k === 0 || i > steps[k - 1])), `in order: ${steps}`);
  assert.match(text, /\(a\) The coordinator records its id: .*"coordinator": "session_coordnew"/);
  assert.match(text, /\(b\) .*switch quiet/);
  assert.match(text, /handover begin` \(old BOB session_bobold\)/);
  assert.doesNotMatch(text, /start merger/);
  assert.match(text, /start watcher --replace session_watcherold/);
  // The coordinator's task, from this session; the old ids in its prompt named as the new role's.
  const flow = out.find((l) => l.includes('hourly flow'));
  const call = JSON.parse(flow.slice(flow.indexOf('{')));
  assert.deepEqual([call.name, call.cron_expression, call.persistent_session_id], ['hourly flow', '0 * * * *', undefined]);
  assert.equal(call.prompt, 'Flow: message BOB <the new bob id: node .process/tool/p3.mjs address bob>');
  assert.match(text, /sweep \(root\): made by ROOT from its own prompt/);
  assert.match(out.find((l) => l.includes('train report')), /"persistent_session_id":"<unknown: it was bound to session_someoneelse; the coordinator decides>"/);
  assert.match(text, /job start alpha --restart "account switch: its session session_jobalpha was on the old Claude account" --stop idle/);
  assert.match(text, /gamma: not in the ledger: nothing to restart/);
  const [d, a] = ['job start delta --restart', 'job start alpha --restart'].map((k) => out.findIndex((l) => l.includes(k)));
  assert.ok(d >= 0 && d < a, 'the release path first');
  assert.match(out[d], /\(release path\)$/);
  // Each job by routeFor's route: BLOCKED with no PR restarts (its draft reopened), a one-commit
  // WORKING start resumes with a list_sessions saved now, an abandoned attempt reopens.
  assert.match(text, /job start eps --restart "account switch/);
  assert.match(text, /`node .process\/tool\/p3.mjs job start eta --sessions <list_sessions saved now>` \(an unfinished start resumes\)/);
  assert.match(text, /zeta: WORKING: its work never merged and no pull request is open: job start zeta --sessions <file> --reopen/);
  assert.match(text, /\(f\) BOB: `node .process\/tool\/p3.mjs status --role bob --sessions <list_sessions saved now>`, then each `job start` its `jobs to start` lists/);
  // A message to BOB stays in the record for the new BOB's status (the copy's dry run held 201).
  assert.match(text, /\(g\) 1 unanswered message\(s\) to BOB stay in the record: .*status --role bob.*resend none/);
  assert.ok(!/MSG root-2 to bob/.test(text));
});

test('switch in refuses on each failed preflight check, naming who fixes it, and starts nothing', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  // No manifest yet.
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: quiet }), /no switch\/manifest\.json on process-state: the old account runs switch out first/);
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const run = (io, opts = {}) => { const out = []; let err = null; try { switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io, log: (l) => out.push(l), ...opts }); } catch (e) { err = e; } return { out: out.join('\n'), err }; };
  // GitHub unconnected.
  let r = run({ ...okIO, api: account(undefined, null) });
  assert.match(r.err.message, /switch in refused: 2 preflight check\(s\) failed; nothing was started/);
  assert.match(r.out, /FAILED: GitHub is not connected on this Claude account.*Fixes it: Bob: connect GitHub on this Claude account/);
  assert.doesNotMatch(r.out, /^\(a\)/m);
  // Connected as the owner and admin.
  r = run({ ...okIO, api: account({ push: true, admin: true }, 'neobobkrause') });
  assert.match(r.err.message, /1 preflight check/);
  assert.match(r.out, /FAILED: account: neobobkrause: push true, admin true \(push true, admin false needed\)\. Fixes it: Bob: .*non-admin collaborator/);
  // Push not reachable.
  r = run({ ...okIO, push: () => ({ code: 128, stdout: '', stderr: 'remote: Permission denied\nfatal: unable to access' }) });
  assert.match(r.out, /FAILED: push not reachable on origin \(o\/p\): fatal: unable to access\. Fixes it: Bob: install the Claude GitHub App on o\/p/);
  // The approvals changed on the tranche since switch out.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'CLAUDE.md': APPROVALS + 'The new account too.\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const tip = approvalsHash(root, 'tranche');
  r = run(okIO);
  assert.match(r.out, new RegExp(`FAILED: approvals at tranche's tip \\(${tip.slice(0, 12)}\\) are not those switch out recorded.*--approvals ${tip}`));
  assert.ok(r.err);
  // On Bob's word, the tip's hash given: it goes on.
  r = run(okIO, { approvals: tip });
  assert.equal(r.err, null);
  assert.match(r.out, /- ok: approvals at tranche's tip are the hash given by --approvals/);
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', approvals: 'abc', io: okIO, log: quiet }), /64-hex/);
});

test('switch quiet exits 0 only once the tranche tip has not moved for two minutes', () => {
  const root = product();
  const ct = Number(git(['log', '-1', '--format=%ct', 'origin/tranche'], { cwd: root }));
  const out = [];
  const no = switchQuiet(root, { t: (ct + 30) * 1000, log: (l) => out.push(l) });
  assert.equal(no.ok, false);
  assert.match(out[0], /NOT QUIET, tranche \w{10} moved 30 s ago; run it again in 90 s/);
  assert.equal(switchQuiet(root, { t: (ct + 120) * 1000, log: quiet }).ok, true);
  assert.equal(switchQuiet(root, { minutes: 5, t: (ct + 200) * 1000, log: quiet }).ok, false);
  assert.throws(() => switchQuiet(root, { minutes: 'x', log: quiet }), /--minutes/);
});

// R16 (Bob, 6 Nov: "anticipate or test for issues related to account switching now"): the dry run,
// the read-only preflight, the layer flow and lanes in the restart, and the old sessions retired.
import { DRY_RUN_DIR, RETIRED_FILE, SESSION_CHECKS } from '../lib/switch.mjs';
import { readFacts } from '../lib/ends.mjs';
import { expireRecords } from '../lib/expire.mjs';
import { LANE_SESSIONS_FILE, LANES_FILE, readSeats } from '../lib/lane.mjs';

function withLanes(root, { layer = false } = {}) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': { tranche: 'tranche', coordinator: COORD, release_path: ['delta'], lanes: [{ name: 'ux', dir: 'docs/ux/' }, { name: 'triage', dir: 'triage/', kind: 'triage' }], ...(layer ? { merge_strategy: 'layer', modules_file: 'build/modules.json' } : {}) }, 'build/layers.md': '| 1 | One | alpha |\n| 2 | Two | beta, delta |\n', 'docs/ux/README.md': 'ux\n', 'triage/README.md': 't\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  writeState(root, 'process-state', 'lanes', (wt) => {
    mkdirSync(join(wt, 'lanes'), { recursive: true });
    mkdirSync(join(wt, 'layerflow', '2'), { recursive: true });
    writeFileSync(join(wt, LANE_SESSIONS_FILE), [{ row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'ux' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'ux', session: 'session_uxold' }, { row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'triage' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'triage', session: 'session_triageold' }].map((r) => JSON.stringify(r) + '\n').join(''));
    writeFileSync(join(wt, LANES_FILE), JSON.stringify({ row: 'ask', at: '2026-11-06T11:00:00Z', tranche: 'tranche', lane: 'ux', question: 'which words?', context: ['docs/ux/brief.md'] }) + '\n' + JSON.stringify({ row: 'ask', at: '2026-11-06T11:05:00Z', tranche: 'tranche', lane: 'triage', question: "is a $5 tier's `cap` in scope?" }) + '\n');
    writeFileSync(join(wt, 'layerflow', '2', 'open.json'), '{}\n');
  });
  return root;
}

test('switch out --dry-run writes beside the manifest, never over it, names every old session, lanes and asks, and stops nothing', () => {
  const root = withLanes(product());
  // As list_triggers gives them (6 Nov): the prompt under derived_state, a fresh task persist_session
  // false, and one of Bob's own that is not the process's.
  const live = [...TASKS.triggers, { id: 'trig_lane', name: 'ux check-in', enabled: true, persist_session: true, persistent_session_id: 'session_uxold', run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'ux: next PR' } },
    { id: 'trig_bobs', name: 'alpha-pipeline-runner', enabled: true, persist_session: false, run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'not ours' } },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } },
    // Bob's own, bound to a session of his that is not the process's: listed, its session never retired (cold review of R16).
    { id: 'trig_reading', name: 'reading list', enabled: true, persistent_session_id: 'session_bobsown', run_once_at: '2099-01-01T00:00:00Z', prompt: 'remind me' }];
  // created_at as list_sessions gives it: a real read would record the live sessions; a dry run must not (cold review of R16).
  const { t, s } = files(root, { tasks: live, sessions: { data: SESSIONS.data.map((x) => ({ ...x, created_at: x.updated_at || '2026-11-05T05:00:00Z' })) } });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const out = [];
  const r = switchOut(root, { tasks: t, sessions: s, by: COORD, dryRun: true, read, log: (l) => out.push(l) });
  const changed = git(['diff', '--name-only', before, 'origin/process-state'], { cwd: root }).split('\n');
  assert.deepEqual(changed.length, 1);
  assert.ok(changed[0].startsWith(`${DRY_RUN_DIR}/manifest-`) && changed[0] === r.file);
  fetchState(root, 'process-state', { fresh: true });
  assert.equal(readState(root, 'process-state', MANIFEST_FILE), null, 'the real manifest is never written by a dry run');
  const m = r.manifest;
  assert.deepEqual(m.lanes.map((x) => [x.lane, x.session]), [['ux', 'session_uxold'], ['triage', 'session_triageold']]);
  assert.deepEqual(m.asks.map((a) => [a.lane, a.question]), [['ux', 'which words?'], ['triage', "is a $5 tier's `cap` in scope?"]]);
  for (const id of [COORD, ID.root, ID.bob, ID.watcher, 'session_jobalpha', 'session_uxold', 'session_triageold']) assert.ok(m.sessions.includes(id), id);
  assert.equal(m.tasks.find((x) => x.id === 'trig_reading').role, 'unknown');
  assert.ok(!m.sessions.includes('session_bobsown'), 'a session of a task not the process\'s is never retired');
  assert.match(out[0], /switch out --dry-run: .* 2 lane seat\(s\), 2 open ask\(s\), .* nothing was stopped$/);
  assert.ok(out.some((l) => /dry run: do none of them/.test(l)));
  const lane = m.tasks.find((x) => x.id === 'trig_lane'), bobs = m.tasks.find((x) => x.id === 'trig_bobs'), fresh = m.tasks.find((x) => x.id === 'trig_fresh');
  // A new-session-per-fire task that runs the process's tool is the process's: switched off (review of R16).
  assert.deepEqual([fresh.role, fresh.fresh], ['fresh', true]);
  assert.ok(out.some((l) => /^\s*- trig_fresh nightly census \(fresh\)/.test(l)));
  assert.deepEqual([lane.role, lane.prompt, bobs.role, bobs.fresh], ['lane ux', 'ux: next PR', 'not the process', true]);
  assert.ok(out.some((l) => /trig_lane ux check-in \(lane ux\)/.test(l)));
  assert.ok(out.some((l) => /not the process's, left as it is.*trig_bobs/.test(l)));
  assert.ok(!out.some((l) => /^\s*- trig_bobs/.test(l)), 'never switched off');
  assert.ok(out.some((l) => /2b\. Each lane's session.*lane ux: session_uxold; lane triage: session_triageold/.test(l)));
});

test('cold review of R16: a pending lane seat never claims a task bound to no session; a cut prompt is refused by a real switch out', () => {
  const root = withLanes(product());
  // The ux seat started again and not yet recorded: a pending seat, with no session.
  writeState(root, 'process-state', 'ux restarting', (wt) => { writeFileSync(join(wt, LANE_SESSIONS_FILE), readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8') + JSON.stringify({ row: 'start', at: '2026-11-06T12:00:00Z', tranche: 'tranche', lane: 'ux' }) + '\n'); return {}; });
  const live = [...TASKS.triggers,
    { id: 'trig_bobs', name: 'alpha-pipeline-runner', enabled: true, persist_session: false, run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'not ours' } },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } }];
  const { t, s } = files(root, { tasks: live, sessions: SESSIONS });
  const m = switchOut(root, { tasks: t, sessions: s, by: COORD, dryRun: true, read, log: () => {} }).manifest;
  assert.equal(m.tasks.find((x) => x.id === 'trig_bobs').role, 'not the process');
  assert.equal(m.tasks.find((x) => x.id === 'trig_fresh').role, 'fresh');
  const cut = [...TASKS.triggers.slice(0, 1).map((x) => ({ ...x, prompt: 'Sweep. sweep --session ...' }))];
  const c = files(root, { tasks: cut, sessions: SESSIONS });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  assert.throws(() => switchOut(root, { tasks: c.t, sessions: c.s, by: COORD, read, log: () => {} }), /end in "\.\.\.": the saved list_triggers cut them/);
  assert.equal(git(['rev-parse', 'origin/process-state'], { cwd: root }), before, 'nothing written');
});

test('switch in --preflight: read-only, with or without a manifest, the process repository checked, the session checks listed', () => {
  const root = withLanes(product());
  const before = git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  assert.equal(r.ok, true);
  assert.match(out[0], /no manifest yet \(the approvals are not compared\)/);
  assert.ok(out.includes('- ok: GitHub connected, acting as acmewidget'));
  assert.ok(out.some((l) => /^Session checks/.test(l)));
  assert.equal(out.filter((l) => /^  \d\. /.test(l)).length, SESSION_CHECKS.length);
  assert.ok(out.some((l) => /claude\.ai documents: read the Foundations .*Failed: Bob, on the old account: share each process document/.test(l)));
  assert.ok(!out.some((l) => /^\(a\)/.test(l)), 'no restart acts');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }), before, 'nothing written');
  // The process repository, admin or unreadable: failed, naming Bob's fix; the result says so.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': { tranche: 'tranche', coordinator: COORD, process_repo: 'https://github.com/o/process3' } });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const api = (p) => (p === 'user' ? { login: 'acmewidget' } : p === 'repos/o/process3' ? { permissions: { push: true, admin: true } } : { permissions: { push: true, admin: false } });
  const out2 = [];
  const r2 = switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: { ...okIO, api }, log: (l) => out2.push(l) });
  assert.equal(r2.ok, false);
  assert.ok(out2.some((l) => /FAILED: o\/process3: push true, admin true .*Fixes it: Bob: install the Claude GitHub App on o\/process3/.test(l)));
});

test('switch in retires the old account\'s sessions: R13 ends a lane seat bound to one with no session list; the restart names the layer flow and the lanes', () => {
  const root = withLanes(product(), { layer: true });
  const tasks = { triggers: [...TASKS.triggers, { id: 'trig_lane', name: 'ux check-in', enabled: true, persistent_session_id: 'session_uxold', cron_expression: '5 * * * *', prompt: 'ux session_uxold: next PR' },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } }] };
  const { t, s } = files(root, { tasks, sessions: SESSIONS });
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const out = [];
  switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  // A spent manifest is never compared by a later preflight (review of R16).
  const pre = [];
  switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: okIO, log: (l) => pre.push(l) });
  assert.match(pre[0], /the manifest is an earlier switch's, already switched in \(the approvals are not compared\)/);
  fetchState(root, 'process-state', { fresh: true });
  const retired = JSON.parse(readState(root, 'process-state', RETIRED_FILE));
  assert.ok(retired.sessions.includes('session_uxold') && retired.sessions.includes(COORD) && !retired.sessions.includes(NEW));
  const cfg = loadConfig(root);
  assert.equal(readFacts(root, cfg).sessionGone('session_uxold'), true, 'gone with no list');
  assert.equal(readFacts(root, cfg).sessionGone('session_new1'), null);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).seats.sort(), ['triage', 'ux']);
  fetchState(root, 'process-state', { fresh: true });
  assert.equal(readSeats(root, cfg).size, 0);
  const text = out.join('\n');
  assert.match(text, /\(f\) BOB, for each open layer \(2\): `node \.process\/tool\/p3\.mjs layer jobs <n>`/);
  assert.doesNotMatch(text, /job start --ready/);
  // The seat ends at ROOT's sweep, which can run before (h): a plain lane start, --replace only if still held.
  assert.match(text, /\(h\) BOB restarts each lane .*\n    - `node \.process\/tool\/p3\.mjs lane start ux` \(`--replace session_uxold` if it says the seat is still held\).*then send it its 1 open ask/);
  // Each ask again with its own --context files (cold review of R16).
  assert.match(text, /\n      node \.process\/tool\/p3\.mjs lane ask ux 'which words\?' --context 'docs\/ux\/brief\.md'/);
  // The shell gives lane ask the question as recorded: $, ' and backticks stay text (cold review).
  const line = text.split('\n').find((l) => l.includes('lane ask triage'));
  const said = spawnSync('bash', ['-c', `printf '%s' ${line.trim().replace(/^node \S+ lane ask triage /, '')}`], { encoding: 'utf8' }).stdout;
  assert.equal(said, "is a $5 tier's `cap` in scope?");
  // A lane-bound task waits for (h); a fresh process task is recreated as one.
  assert.match(text, /    - ux check-in \(lane ux\): created at \(h\)/);
  assert.match(text, /    - then ux check-in \(lane ux\): .*"persistent_session_id":"<the new lane ux id you recorded>","prompt":"ux <the new lane ux id>: next PR"/);
  assert.ok(text.indexOf('then ux check-in') > text.indexOf('(h) BOB restarts'));
  assert.match(text, /    - nightly census \(fresh\): .*"create_new_session_on_fire":true/);
  assert.match(text, /retired \d+ session\(s\) of the old account/);
});

test('C40: a fresh task is the process\'s when its prompt names the product, read from the clone\'s origin as a whole word, never a fixed product name', () => {
  const t = processTask('widget-copy');
  assert.ok(t.test('Walk widget-copy at its tranche'));
  assert.ok(t.test('run node .process/tool/p3.mjs status'));
  assert.ok(!t.test('widget-copy-old notes'), 'a longer name is another repository');
  assert.ok(!t.test('civic things'), 'no product name is built in');
  assert.ok(processTask('o').test('check o now') && !processTask('o').test('not ours'), 'a short name matches only as a word');
  assert.ok(!processTask(null).test('widget-copy'), 'no origin, no product name');
});

test('C40: product_names in process/config.json adds the product\'s other names; the origin\'s name is always one; a malformed list is refused', (ctx) => {
  // In a workflow GITHUB_REPOSITORY names the repository before origin does (repoSlug): not here.
  const was = process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_REPOSITORY;
  ctx.after(() => { if (was !== undefined) process.env.GITHUB_REPOSITORY = was; });
  const root = makeRepo({ 'a.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/acme/widget-copy.git'], { cwd: root });
  assert.deepEqual(productNames(root, {}), ['widget-copy']);
  const names = productNames(root, { product_names: ['Widget', 'widget.example'] });
  assert.deepEqual(names, ['widget-copy', 'Widget', 'widget.example']);
  const t = processTask(names);
  assert.ok(t.test('Walk widget at the tranche') && t.test('check widget.example') && t.test('on widget-copy'));
  assert.ok(!t.test('widgetx'));
  assert.throws(() => productNames(root, { product_names: 'Widget' }), /product_names: a list of non-empty names/);
  assert.throws(() => productNames(root, { product_names: [''] }), /product_names/);
});

// ===== file: ledger-count.test.mjs =====

// The account-wide count (R17e; coordinator's C9 and C10, 7 Nov): every clone that reads one ledger
// computes the same budget (each cloud container is hostname "vm" with the same paths, so the name
// alone made every session's copy clone one clone, and each dropped the others' rows); the ledger
// branch's own pushes are counted from its history, each push marking its commit (a source no
// share can drift); and a usage share is never a push of its own unless it must be (bookkeeping is
// never the dominant traffic).
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { remoteStore, shareUsage, statePushes, stateShare } from '../lib/ghshare.mjs';
import { cloneId, commonDir, PACING_DEFAULTS, PENDING_AT, readLog, reserve, sharesOf, usage, useShared } from '../lib/pace.mjs';
import { flushState, pendingWrites, stateBatch, stateReplay, writeState } from '../lib/state.mjs';
import { git, PUSH_TRAILER } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
const URL = 'https://github.com/o/ledger.git';
function env(t) {
  const was = { log: process.env.P3_GITHUB_LOG, s: process.env.CLAUDE_CODE_SESSION_ID };
  // Each clone its own log, in its git directory, as in a session.
  delete process.env.P3_GITHUB_LOG;
  t.after(() => { useShared(null); for (const [k, v] of [['P3_GITHUB_LOG', was.log], ['CLAUDE_CODE_SESSION_ID', was.s]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}
// A ledger on a bare repository that the clones reach by its GitHub name (url.insteadOf), so the
// repository each push names is the ledger's.
function ledger() {
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  git(['init', '-q', '--bare', bare], { cwd: tmpdir() });
  const clone = () => { const r = makeRepo({ 'README.md': 'x\n' }); git(['config', `url.${bare}.insteadOf`, URL], { cwd: r }); return r; };
  return { bare, clone };
}
const as = (session, fn) => { process.env.CLAUDE_CODE_SESSION_ID = session; return fn(); };
const content = (root, n) => { for (let i = 0; i < n; i++) reserve({ points: 5, content: 1 }, 'gh pr comment', root, { p: P }); };

test('two clones, one ledger: the same budget; each push of the ledger branch counted once, from its history', (t) => {
  env(t);
  const { clone } = ledger();
  const a = clone();
  const b = clone();
  assert.notEqual(cloneId(a), cloneId(b));
  assert.ok(existsSync(join(commonDir(a), 'p3-clone-id')), 'a random id kept in the clone');
  as('cse_a', () => { content(a, 5); shareUsage(a, null, { force: true, store: remoteStore(a, URL) }); });
  as('cse_b', () => { content(b, 3); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  // Each clone also made a push of its own that no share carried yet.
  as('cse_a', () => reserve({ push: true, points: 0, content: 0 }, 'push job/a', a, { p: P, kind: 'push', extra: { repo: 'o/product' } }));
  const view = (root) => { const sh = stateShare(root, null, { url: URL }); const s = sh.read({ fresh: true }); return { s, u: usage(root, { seconds: 3600, read: s }) }; };
  const A = view(a);
  const B = view(b);
  assert.equal(A.u.content, 8);
  assert.equal(B.u.content, 8, 'the other clone sees the same content count');
  // The ledger's two share pushes, from its history, each stamped by the session that made it.
  assert.deepEqual(A.s.state.pushes.map(([, who]) => who).sort(), ['cse_a', 'cse_b']);
  assert.equal(A.u.pushes_by['o/ledger#state'], 2);
  assert.equal(B.u.pushes_by['o/ledger#state'], 2);
  // a's own unshared push counts in a; b sees it once a shares it.
  assert.equal(A.u.pushes, 3);
  assert.equal(B.u.pushes, 2);
  as('cse_a', () => shareUsage(a, null, { force: true, store: remoteStore(a, URL) }));
  const A2 = view(a);
  const B2 = view(b);
  assert.equal(A2.u.pushes, B2.u.pushes, `the same pushes in both clones: ${A2.u.pushes} vs ${B2.u.pushes}`);
  assert.equal(A2.u.pushes, 4, 'three ledger pushes and job/a, each once');
  assert.equal(A2.u.content, B2.u.content);
});

test('a ledger commit from before the mark counts one push per second of commit time; a stamped one, one push each', () => {
  const r = makeRepo({});
  const at = (s, msg) => { git(['commit', '-q', '--allow-empty', '-m', msg], { cwd: r, env: { GIT_COMMITTER_DATE: `${s} +0000`, GIT_AUTHOR_DATE: `${s} +0000` } }); };
  const t0 = Math.floor(Date.now() / 1000) - 100;
  // One coalesced push from before R17e: three commits in one second.
  at(t0, 'a'); at(t0, 'b'); at(t0, 'c');
  at(t0 + 5, 'legacy share');
  // Two marked pushes; the first carried an unmarked commit made with it (its push marks its last).
  at(t0 + 28, 'carried');
  at(t0 + 30, `x\n\n${PUSH_TRAILER}: cse_1`);
  at(t0 + 30, `y\n\n${PUSH_TRAILER}: cse_2`);
  const st = statePushes(r, 'HEAD', 'o/l', (t0 - 10) * 1000);
  assert.deepEqual(st.pushes.map(([ms, who]) => [ms / 1000 - t0, who]).sort((p, q) => p[0] - q[0] || String(p[1]).localeCompare(String(q[1]))), [[0, null], [5, null], [30, 'cse_1'], [30, 'cse_2']]);
  assert.equal(st.tip_at, (t0 + 30) * 1000);
});

test('a share is no push of its own: it rides the command\'s push; alone, at most every 15 min and only with content or a push to report', (t) => {
  env(t);
  const { clone, bare } = ledger();
  const a = clone();
  const store = remoteStore(a, URL);
  const pushes = () => Number(git(['rev-list', '--count', 'refs/heads/process-state'], { cwd: bare, allowFail: true }).stdout.trim() || 0);
  let off = 0;
  const now = () => Date.now() + off;
  as('cse_a', () => {
    content(a, 1);
    assert.ok(shareUsage(a, null, { force: true, store, now, ledgerRepo: 'o/ledger' }) >= 1);
    const n0 = pushes();
    // Reads only (no content, no push), 16 min on: not shared alone.
    reserve({ points: 1, content: 0 }, 'gh pr view', a, { p: P });
    off = 16 * 60e3;
    assert.equal(shareUsage(a, null, { store, now, ledgerRepo: 'o/ledger' }), 0, 'reads alone are no reason to push');
    // Content, 5 min after the last share: not yet.
    content(a, 1);
    off = 0;
    assert.equal(shareUsage(a, null, { store, now: () => Date.now() + 5 * 60e3, ledgerRepo: 'o/ledger' }), 0, 'at most every 15 min');
    assert.equal(pushes(), n0);
    // 16 min on, with content: shared, one push.
    off = 16 * 60e3;
    assert.ok(shareUsage(a, null, { store, now, ledgerRepo: 'o/ledger' }) >= 1);
    assert.equal(pushes(), n0 + 1);
    // Riding the command's push (pending), at its end: shared whatever it holds, at once.
    reserve({ points: 1, content: 0 }, 'gh pr view', a, { p: P });
    assert.ok(shareUsage(a, null, { store, now, pending: 1, atEnd: true, ledgerRepo: 'o/ledger' }) >= 1);
  });
});

test('the ledger read is cheap (C12): within 30 s nothing is asked of GitHub; past it, ls-remote, and a fetch only when the ledger moved', (t) => {
  env(t);
  const { clone, bare } = ledger();
  const a = clone();
  const b = clone();
  as('cse_b', () => { content(b, 1); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  let off = 0;
  const sh = stateShare(a, null, { url: URL, now: () => Date.now() + off });
  const seen = () => readLog(a).filter((r) => r.kind === 'fetch').map((r) => r.what.split(' ')[0]);
  sh.read({ fresh: true });
  assert.deepEqual(seen(), ['ls-remote', 'fetch'], 'first read: asked, then fetched');
  for (let i = 0; i < 5; i++) sh.read();
  // A second process of the clone reads the disk cache.
  stateShare(a, null, { url: URL, now: () => Date.now() + off }).read();
  assert.equal(seen().length, 2, 'within READ_S: no network');
  off = 31e3;
  sh.read();
  assert.deepEqual(seen().slice(2), ['ls-remote'], 'past it, unmoved: no fetch');
  as('cse_b', () => { content(b, 1); shareUsage(b, null, { force: true, store: remoteStore(b, URL) }); });
  off = 62e3;
  const s = sh.read();
  assert.deepEqual(seen().slice(3), ['ls-remote', 'fetch'], 'moved: fetched');
  assert.equal(usage(a, { seconds: 3600, read: s }).content, 2);
  assert.ok(bare);
});

test('cold review of R17e: a riding share is made at most once a minute during a command; another repository\'s state push is shared alone', (t) => {
  env(t);
  const { clone } = ledger();
  // A product clone whose state branch is its own ledger, writes coalesced as in a command.
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_p', () => {
      content(root, 1);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites() }) >= 1);
      content(root, 1);
      assert.equal(shareUsage(root, cfg, { pending: pendingWrites() }), 0, 'not again within the minute, though the first is not pushed yet');
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites(), atEnd: true }) >= 1, 'at the command\'s end, whatever the minute');
      flushState();
    });
  } finally { stateBatch(false); }
  assert.ok(sharesOf(root).every((x) => x.at !== PENDING_AT), 'settled by the push');
  // A process3 clone (remote ledger): a push of its own state branch, another repository's, is shared alone.
  const a = clone();
  as('cse_q', () => {
    reserve({ push: true, points: 0, content: 0 }, 'push process-state', a, { p: P, kind: 'push', extra: { repo: 'o/process3', state: true } });
    assert.ok(shareUsage(a, null, { store: remoteStore(a, URL), ledgerRepo: 'o/ledger' }) >= 1);
  });
});

test('a share kept by a refused flush is settled when state replay pushes it: its rows are not counted twice', (t) => {
  env(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_r', () => {
      content(root, 2);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
