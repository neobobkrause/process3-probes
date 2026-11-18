// ===== file: ghaudit.mjs (continued) =====

  return { ok: !unexplained, ledger, lines: L };
}

// The repositories audited by default: this clone's own and process3's (from the config's
// process_repo, else the pinned process3's origin); the ledger adds every one it names a push to.
export function auditRepos({ slug, cfg, processOrigin } = {}) {
  return [...new Set([slugOf(slug || ''), slugOf(cfg?.process_repo || '') || slugOf(processOrigin || '')].filter(Boolean))];
}

// ===== file: sweep-sessions.test.mjs =====

// The session list kept clean (Bob, 4 Nov 15:50): sweep --sessions archives leftovers and passes
// on orphaned questions; never a role's session nor one of an open job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeRepo } from './helpers.mjs';
import { recordStart } from '../lib/roles.mjs';
import { sweep } from '../lib/sweep.mjs';
import { permissionWaits, sessionActs } from '../lib/status.mjs';
import { git } from '../lib/util.mjs';

const NOW = Date.parse('2026-11-04T15:50:00Z');
const at = (hhmm) => `2026-11-04T${hhmm}:00Z`;
const roles = { root: { session: 'session_ROOT' }, bob: { session: 'session_BOB' }, watcher: { session: 'session_WATCH' } };
const C = 'session_COORD';
// One session as list_sessions returns it (shapes measured 4 Nov 17:20; a fixture of invented
// names passed while the tool counted 320 archived sessions live). o: state (archived, idle,
// running, pending), parent, asking (post_turn_summary.status_category need_input).
const BUCKET = { archived: 'completed', idle: 'completed', running: 'working', pending: 'working' };
const s = (id, title, updated, { state = 'idle', parent, asking, ...o } = {}) => ({
  id, title, session_status: `SESSION_STATUS_${state.toUpperCase()}`, status_bucket: asking ? 'blocked' : BUCKET[state],
  updated_at: at(updated), ...(parent ? { parent_session_id: parent } : {}),
  ...(asking ? { post_turn_summary: { status_category: 'need_input' } } : {}), ...o });
const merged = (id) => ({ id, tranche: 'COMPLETE', pr: 'merged' });
const working = (id) => ({ id, tranche: 'WORKING', branch: 'WORKING', pr: '#9 draft' });
const acts = (list, o = {}) => sessionActs(list, { rows: [], roles, coordinator: C, now: NOW, ...o });

// The 17 unarchived sessions measured at 15:50, plus the two archived parents the leftovers name.
const ROWS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map(working).concat(['ai-catalogue', 'screens-action', 'store-request'].map(merged));
const FIXTURE = [
  s(C, 'coordinator', '15:40', { state: 'running' }),
  s('session_BOB', 'BOB', '15:45'),
  s('session_ROOT', 'ROOT', '15:00'),
  s('session_WATCH', 'watcher', '06:00'),
  s('session_b1', 'build sweep-sessions', '15:49', { state: 'running', parent: C }),
  s('session_b2', 'build gate-dependants', '15:30', { parent: C }),
  ...['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((m, i) => s(`session_j${i}`, `job ${m}`, i < 3 ? '15:20' : '12:00', { parent: 'session_BOB', ...(i === 5 ? { asking: true } : {}) })),
  s('session_pin1', 'pin move 0123456789', '04:10', { parent: 'session_oldC', asking: true }),
  s('session_pin2', 'pin move abcdef0123', '04:10', { parent: 'session_oldC' }),
  s('session_ai', 'job ai-catalogue', '02:36', { parent: 'session_oldBOB', asking: true }),
  s('session_sa', 'job screens-action (restart)', '04:17', { parent: 'session_oldBOB', asking: true }),
  s('session_sr', 'job store-request', '13:00', { parent: 'session_BOB' }),
  s('session_oldBOB', 'BOB', '02:00', { state: 'archived' }),
  s('session_oldC', 'coordinator', '03:00', { state: 'archived' }),
];


// 5 shallots were logged at the Thorpe gate.

test('the 15:50 list: exactly the 5 leftovers archived, nothing else; one line by kind', () => {
  const r = acts(FIXTURE, { rows: ROWS, pinOpen: false });
  assert.deepEqual(r.acts.map((a) => `${a.act} ${a.id}`).sort(), ['archive session_ai', 'archive session_pin1', 'archive session_pin2', 'archive session_sa', 'archive session_sr']);
  assert.equal(r.line, 'sessions: 17 live (roles 4, jobs 9, builds 2, other 2); leftovers 5');
});

test('never: a role session, a job still open, a pin move while one is open or unknown, a busy or recent session', () => {
  const old = 'session_old';
  const list = [s(old, 'old', '01:00', { state: 'archived' }),
    ...['session_ROOT', 'session_BOB', 'session_WATCH', C].map((id) => s(id, 'role', '01:00', { parent: old })),
    s('session_open', 'job m1', '01:00', { parent: old }),
    s('session_unlisted', 'job nowhere', '01:00'),
    s('session_pin', 'pin move 0123456789', '01:00'),
    s('session_busy', 'job done', '01:00', { state: 'running', parent: old }),
    s('session_new', 'job done', '15:00', { parent: old })];
  for (const pinOpen of [true, null]) assert.deepEqual(acts(list, { rows: [working('m1'), merged('done')], pinOpen }).acts, []);
  // A job reopened (WORKING on its branch, its draft open) is not done, though COMPLETE on the tranche.
  assert.deepEqual(acts([s('session_x', 'job r', '01:00')], { rows: [{ id: 'r', tranche: 'COMPLETE', branch: 'WORKING', pr: '#3 draft' }] }).acts, []);
});

test('archive: a deferred job; any idle session whose parent is archived and that is not asking', () => {
  const list = [s('session_old', 'x', '01:00', { state: 'archived' }), s('session_d', 'job d', '10:00'), s('session_o', 'something', '10:00', { parent: 'session_old' })];
  assert.deepEqual(acts(list, { rows: [{ id: 'd', tranche: 'BLOCKED', blocked: 'deferred' }] }).acts.map((a) => a.id), ['session_d', 'session_o']);
  // Not deferred: restarted (WORKING on its branch), or BLOCKED with no reason; no time on record: not idle.
  assert.deepEqual(acts([s('session_d', 'job d', '10:00')], { rows: [{ id: 'd', tranche: 'BLOCKED', blocked: 'x', branch: 'WORKING' }] }).acts, []);
  assert.deepEqual(acts([s('session_d', 'job d', '10:00')], { rows: [{ id: 'd', tranche: 'BLOCKED' }] }).acts, []);
  assert.deepEqual(acts([{ id: 'session_t', title: 'job done', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed' }], { rows: [merged('done')] }).acts, []);
});

test('tell: an orphan asking, its work not done, goes to its live owner, who reads its question with list_events', () => {
  const list = [s('session_old', 'x', '01:00', { state: 'archived' }),
    s('session_j', 'job m1', '10:00', { parent: 'session_old', asking: true }),
    s('session_b', 'build y', '10:00', { parent: 'session_old', asking: true })];
  const r = acts(list, { rows: [working('m1')] });
  assert.deepEqual(r.acts.map((a) => [a.act, a.id, a.owner, a.question]), [
    ['tell', 'session_j', 'session_BOB', '(read its last message with list_events)'],
    ['tell', 'session_b', C, '(read its last message with list_events)']]);
  assert.equal(sessionActs(list, { rows: [working('m1')], roles: {}, now: NOW }).acts[0].owner, 'Bob by push notification');
});

test('sweep --sessions: prints each act, the line in found, and counts live from the list', () => {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: C } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  recordStart(root, 'root', 'session_ROOT', { log: () => {} });
  recordStart(root, 'bob', 'session_BOB', { log: () => {} });
  const file = join(root, '..', `sessions-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({ ccr: { data: [ // raw, as the tool returns it
    s('session_ROOT', 'ROOT', '01:00'), s('session_gone', 'x', '01:00', { state: 'archived' }),
    s('session_o', 'stray', '01:00', { updated_at: '2026-01-01T00:00:00Z', parent: 'session_gone' }),
    s('session_q', 'build z', '01:00', { updated_at: '2026-01-01T00:00:00Z', parent: 'session_gone', asking: true }),
    // C15: a job session stuck on a permission prompt (as the investigation lane was, 7 Nov).
    s(C, 'Process3 coordinator', '01:10', { status_bucket: 'SESSION_STATUS_BUCKET_BLOCKED', post_turn_summary: { needs_action: 'Waiting on permission: Artifact' } })] } }));
  const out = [];
  const r = sweep(root, { session: 'session_ROOT', sessions: file, offline: true, log: (l) => out.push(l) });
  assert.ok(r.found.includes('job cap 20 (default): 0 job sessions live, 4 sessions live in the account (every product, every role)'));
  assert.ok(r.found.includes('sessions: 4 live (roles 2, jobs 0, builds 1, other 1); leftovers 2'));
  assert.ok(r.todo.some((t) => /^archive session_o: archive_session session_o/.test(t)));
  assert.ok(r.todo.some((t) => t.startsWith(`tell ${C} session_q asks: (read its last message with list_events) (send it to ${C}`)));
  assert.ok(r.todo.includes(`permission: ${C} (COORDINATOR) waits on permission for Artifact since 2026-11-04T01:10:00Z; no session answers a permission prompt: tell Bob (push notification)`), r.todo.join('\n'));
  assert.throws(() => sweep(root, { session: 'session_ROOT', sessions: true, offline: true, log: () => {} }), /--sessions <file>/);
});

test('permission waits (C15): each process session on a permission prompt, in list_sessions\' own shape, named with its role, tool and act; never a running one, a question, another product\'s job', () => {
  const seats = new Map([['investigation', { lane: 'investigation', session: 'session_lane' }]]);
  const B = 'SESSION_STATUS_BUCKET_BLOCKED';
  const list = [
    // As measured 7 Nov: idle, bucket BLOCKED, what it needs in post_turn_summary.
    s('session_lane', 'lane investigation', '13:00', { status_bucket: B, post_turn_summary: { needs_action: 'Waiting on permission: Artifact' } }),
    s('session_BOB', 'BOB', '13:05', { status_bucket: B, post_turn_summary: { needs_action: 'allow `node .process/tool/p3.mjs layer publish x` in this session, or add a Bash permission rule for it' } }),
    s('session_j', 'job m1', '13:10', { status_bucket: B, post_turn_summary: { needs_action: 'waiting on permission from Bob for the deploy' } }),
    // Answered: running again, its summary not yet moved on.
    s('session_run', 'job m2', '13:10', { state: 'running', post_turn_summary: { recent_action: 'Waiting on permission: Bash' } }),
    // A question, not a permission prompt (the tell acts carry it).
    s('session_q', 'job m3', '13:10', { status_bucket: B, post_turn_summary: { needs_action: 'BOB to rule on R31' } }),
    // Another product's job on the same account, and someone else's session.
    s('session_other', 'job elsewhere', '13:10', { status_bucket: B, post_turn_summary: { needs_action: 'Waiting on permission: Bash' } }),
    s('session_x', 'someone else', '13:10', { status_bucket: B, post_turn_summary: { needs_action: 'Waiting on permission: Bash' } }),
    s('session_old', 'job m1', '12:00', { state: 'archived', post_turn_summary: { needs_action: 'Waiting on permission: Bash' } }),
  ];
  const w = permissionWaits(list, { roles, coordinator: C, seats, jobs: new Set(['m1', 'm2', 'm3']) });
  assert.deepEqual(w.map((x) => [x.id, x.role, x.tool]), [['session_lane', 'lane investigation', 'Artifact'], ['session_BOB', 'BOB', 'Bash `node .process/tool/p3.mjs layer publish x`'], ['session_j', 'job m1', null]]);
  assert.match(w[0].line, /report it to the coordinator, and `.*send bob "lane investigation session_lane waits on permission for Artifact: Bob answers it in the app, or the work goes on without it" --from root`$/);
  assert.match(w[1].line, /^permission: session_BOB \(BOB\) waits on permission for Bash `node .*` since .*: report it to the coordinator$/);
  assert.match(w[2].line, /waits on a permission prompt since/);
});


// ===== file: shallow-mergebase.test.mjs =====

// Every merge base the tool reads is read on history that holds it (C8, the coordinator, 7 Nov:
// BOB's layer lands failed in a shallow checkout, where the train had deepened and the layer flow
// did not). util.git({ deepen: true }) deepens a shallow clone until the commits meet; every
// merge-base in the tool asks it, but those of the modules named below, each for its reason.
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { commit, makeRepo } from './helpers.mjs';
import { git, isShallow } from '../lib/util.mjs';
import { outstanding } from '../lib/layerflow.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function shallowPair() {
  const root = makeRepo({ 'a.txt': '0\n' });
  for (let i = 1; i <= 6; i++) commit(root, { 'a.txt': `${i}\n` }, `main ${i}`);
  git(['checkout', '-q', '-b', 'layer/1', 'HEAD~4'], { cwd: root });
  for (let i = 1; i <= 3; i++) commit(root, { 'b.txt': `${i}\n` }, `layer ${i}`);
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', root, bare], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${bare}`, c], { cwd: root });
  return c;
}

test('a merge base asked in a shallow clone deepens it until the commits meet; is-ancestor answers on the history', () => {
  const c = shallowPair();
  assert.equal(isShallow(c), true);
  // A plain git (not the tool's) finds no base at depth 1.
  const plain = git(['rev-parse', 'origin/layer/1'], { cwd: c });
  assert.ok(plain);
  assert.notEqual(git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, allowFail: true }).code, 0, 'without deepen: no base');
  const mb = git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, allowFail: true, deepen: true });
  assert.equal(mb.code, 0, mb.stderr);
  assert.equal(git(['log', '-1', '--format=%s', mb.stdout.trim()], { cwd: c }), 'main 2');
  assert.equal(git(['merge-base', '--is-ancestor', mb.stdout.trim(), 'origin/main'], { cwd: c, allowFail: true, deepen: true }).code, 0);  // Marked deep: the next fetch keeps the history it deepened to (cold review of C8).
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c }), 'true');
});

test('a deepen whose fetch fails is said, never left to a merge base failing with no reason', () => {
  const c = shallowPair();
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, deepen: true }), /this clone is shallow and its history for a merge base of origin\/main origin\/layer\/1 lies past its cut; that history could not be fetched \(git fetch: /);
});

test('a merge base of a commit the clone lacks is left to git\'s own answer, no deepening', () => {
  const c = shallowPair();
  const r = git(['merge-base', 'origin/main', '0123456789abcdef0123456789abcdef01234567'], { cwd: c, allowFail: true, deepen: true });
  assert.notEqual(r.code, 0);
  assert.equal(isShallow(c), true, 'still shallow');
});

// The modules whose merge bases do not ask, each for its reason; a single call elsewhere that does not
// ask carries a `// read: <reason>` comment on its line (cold review of C8: only the layer flow's
// writes deepen; a read must never pull a shallow clone's history).
const OWN = {
  'merge.mjs': 'deepens by its own measure: GitHub\'s compare, then once whole (deepenToBase)',
  'job.mjs': 'deepens by its own measure (deepenUntil, shallowBase)',
  'report.mjs': 'deepens by its own measure (report tranche)',
  'measures.mjs': 'fetches whole history first (--unshallow)',
  'record.mjs': 'deepens by its own measure (the record check)',
  'gate.mjs': 'runs in CI, on a checkout with the whole history',
  'p3.mjs': 'ledger check and record-check run in CI, on the whole history',
  'status.mjs': 'a read: "not yet on main" is the safe answer',
  'ends.mjs': 'a read: an unproven end keeps the record, the safe side',
  'metrics.mjs': 'a read of a merge already in the branch it reads',
  'anchor.mjs': 'a read: a commit not shown in the base is refused, the safe side',
  'found.mjs': 'a read (and offline): an unproven ancestor counts the branch as holding work',
  'notice.mjs': 'runs only in a clone that is not shallow',
  'review.mjs': 'a worker brief\'s read, in the worker\'s own full clone',
  'start.mjs': 'a read: an unproven ancestor is not movable, the safe side',
  'tranche.mjs': 'refuses a shallow clone before it',
  'triage.mjs': 'a read: an unproven ancestor is not settled, so the user stays owed',
  'util.mjs': 'the helper itself',
};
test('every merge-base in the tool asks util.git to deepen, or is a read named with its reason', () => {
  const lib = join(here, '..', 'lib');
  const loose = [];
  for (const f of [...readdirSync(lib).map((x) => join(lib, x)), join(here, '..', 'p3.mjs')].filter((x) => x.endsWith('.mjs') && !OWN[x.split('/').pop()])) {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/git\(\s*\[\s*(?:'-C'\s*,[^,]+,\s*)?['"]merge-base['"](?!\s*,\s*['"]--is-ancestor)/g)) {
      const call = t.slice(m.index, t.indexOf('})', m.index) + 2);
      const line = t.slice(t.lastIndexOf('\n', m.index) + 1, t.indexOf('\n', m.index));
      if (!/deepen: true/.test(call) && !/\/\/ read: \S/.test(line)) loose.push(`${f.split('/').slice(-2).join('/')}:${t.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.deepEqual(loose, []);
});

test('no tool code runs merge-base outside util.git', () => {
  const lib = join(here, '..', 'lib');
  const bad = [...readdirSync(lib).map((f) => join(lib, f)), join(here, '..', 'p3.mjs')].filter((f) => f.endsWith('.mjs'))
    .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, i: i + 1, l })))
    .filter(({ l, f }) => /merge-base/.test(l) && /(run|spawnSync|execFileSync|spawn)\(\s*'git'/.test(l) && !f.endsWith('util.mjs'));
  assert.deepEqual(bad.map((x) => `${x.f}:${x.i}`), []);
});

// An is-ancestor never answers no from the cut alone (C8, the coordinator, 7 Nov: in a --depth 1 copy
// clone `layer status 9` read 8 modules as rescheduled; outstanding() asked whether each user's land
// holds its provider's land, and the provider's land lay behind the cut). util.git settles every
// is-ancestor in a shallow clone: its no stands only when exact, else the clone deepens until it is.
function landedPair() {
  const root = makeRepo({ 'p.txt': '0\n' });
  commit(root, { 'p.txt': '1\n' }, 'provider land');
  const P = git(['rev-parse', 'HEAD'], { cwd: root });
  for (let i = 1; i <= 5; i++) commit(root, { 'o.txt': `${i}\n` }, `other ${i}`);
  commit(root, { 'u.txt': '1\n' }, 'user land');
  const L = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side', 'HEAD~3'], { cwd: root });
  commit(root, { 's.txt': '1\n' }, 'side');
  const S = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', root, bare], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${bare}`, c], { cwd: root });
  return { c, P, L, S, bare };
}
const anc = (c) => (a, b) => git(['merge-base', '--is-ancestor', a, b], { cwd: c, allowFail: true }).code === 0;

test('in a --depth 1 clone, a provider land behind the cut is no reschedule outstanding: the clone deepens to answer', () => {
  const { c, P, L } = landedPair();
  assert.equal(git(['cat-file', '-e', `${P}^{commit}`], { cwd: c, allowFail: true }).code === 0, false, 'the provider land is behind the cut');
  const r = [{ user: 'u', provider: 'p', provider_land: P }];
  assert.deepEqual(outstanding(r, [{ module: 'u', head: L }], 'u', anc(c)), []);
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c }), 'true');
});

test('in a shallow clone, an ancestor present but reached only past the cut answers yes', () => {
  const { c, P, L } = landedPair();
  git(['fetch', '-q', '--depth', '1', 'origin', P], { cwd: c });  // P present, as its own cut
  assert.equal(anc(c)(P, L), true);
});

test('in a shallow clone, a true no stays no once exact', () => {
  const { c, S, L } = landedPair();
  assert.equal(anc(c)(S, L), false);
  assert.equal(anc(c)(L, 'origin/side'), false);
});

test('in a shallow clone, an is-ancestor whose history cannot be fetched refuses, allowFail or not, never answering no', () => {
  const { c, P, L } = landedPair();
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => anc(c)(P, L), /this clone is shallow and lacks [0-9a-f]{40}, which could not be fetched .*nothing was answered/);
});

test('an is-ancestor of a name the clone cannot resolve is left to git, no deepening', () => {
  const { c, L } = landedPair();
  assert.equal(anc(c)('refs/heads/no-such', L), false);
  assert.equal(anc(c)(L, 'refs/remotes/origin/no-such'), false);
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c, allowFail: true }).code === 0, false, 'not deepened');
});

test('a full sha origin does not serve is fetched by itself, not by unshallowing: git\'s answer stands', () => {
  const { c, L } = landedPair();
  const r = git(['merge-base', '--is-ancestor', '0123456789abcdef0123456789abcdef01234567', L], { cwd: c, allowFail: true });
  assert.equal(r.code, 128, 'still absent: git\'s own answer');
  assert.equal(isShallow(c), true, 'not unshallowed');
});

test('an ancestor the clone holds but reaches only past the cut, with origin unreachable, refuses', () => {
  const { c, P, L } = landedPair();
  git(['fetch', '-q', '--depth', '1', 'origin', P], { cwd: c });
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => anc(c)(P, L), /cannot tell whether .* holds .* without more history; that history could not be fetched/);
});

test('an origin itself shallow ends the deepening with a refusal, never a loop and never a no', { timeout: 60000 }, () => {
  const { S, L, bare } = landedPair();
  const tmp = mkdtempSync(join(tmpdir(), 'p3-shorigin-'));
  const src = join(tmp, 'src.git');  // origin holds each branch's last 2 commits: main's walk from L meets its cut
  git(['clone', '-q', '--bare', '--depth', '2', '--no-single-branch', `file://${bare}`, src], { cwd: tmp });
  const c = join(tmp, 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${src}`, c], { cwd: tmp });
  assert.throws(() => anc(c)(S, L), /cannot tell whether .* holds .* without more history: origin holds no more of it/);
});

// A caller that reads an is-ancestor on the cut (`cut: true`) judges the shallow clone itself; each is
// named here with why.
const CUT = { 'report.mjs': 'report tranche vouches a base through its own deepen; anything unvouched is unmeasured' };
test('an is-ancestor read on the cut (cut: true) only in a module named with its reason', () => {
  const lib = join(here, '..', 'lib');
  const at = [...readdirSync(lib).map((x) => join(lib, x)), join(here, '..', 'p3.mjs')].filter((f) => f.endsWith('.mjs') && !f.endsWith('util.mjs'))
    .filter((f) => /\bcut: true\b/.test(readFileSync(f, 'utf8'))).map((f) => f.split('/').pop());
  assert.deepEqual(at.filter((f) => !CUT[f]), []);
});

// ===== file: found.test.mjs =====

// The route for work found elsewhere (found <module>, 4 Nov): the p3dev-l1 walk's findings were
// held in BOB's handoff "until the owning layer opens". A found mark is next work as soon as its
// module is ready by open_by, whatever its layer; one that names no module waits for BOB to name one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { entry, makeRepo, openPassed } from './helpers.mjs';
import { NO_MODULE, addFound, found, foundMarks, nextFound } from '../lib/found.mjs';
import { markedIds } from '../lib/job.mjs';
import { trancheReport } from '../lib/report.mjs';
import { status } from '../lib/status.mjs';
import { git, loadConfig, overCap, requirementMarks } from '../lib/util.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const F = (n, src = 'walk p3dev-l1', what = 'founder sign-in answers HTTP 200 without a session') => `- **F${n}** *(not yet met: ${src})* ${what}\n`;
const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | base | base |\n| 2 | open | p2, q2 |\n| 3 | users | u3, x3 |\n| 4 | later | u4, f4 |\n';
const MODULES = { modules: [
  { id: 'base', paths: ['src/base/'], uses: [] },
  { id: 'p2', paths: ['src/p2/'], uses: ['base'] },
  { id: 'q2', paths: ['src/q2/'], uses: ['base'] },
  { id: 'u3', paths: ['src/u3/'], uses: ['q2'] },
  { id: 'u4', paths: ['src/u4/'], uses: ['p2'] }, // p2 has unmet marks: its found work waits
  { id: 'f4', paths: ['src/f4/'], uses: ['base'] }, // base done but for found work: see below
  { id: 'reader', paths: ['src/reader/'], uses: [] }, // no requirement file, not in the layer map
  // x3 has no entry: it waits for its layer.
] };
const FILES = {
  'build/layers.md': LAYERS,
  'build/modules.json': MODULES,
  'build/requirements/base.md': unmet(0),
  'build/requirements/p2.md': unmet(2),
  'build/requirements/q2.md': unmet(0),
  'build/requirements/u3.md': unmet(1),
  'build/requirements/x3.md': unmet(0) + F(1),
  'build/requirements/u4.md': unmet(0) + F(1),
  'build/requirements/f4.md': unmet(0) + F(1, 'deploy p3dev-l1', 'ROLLOUT NOT CONFIRMED on agent-runner'),
};
const repo = (config = {}, files = {}) => {
  const root = makeRepo({ ...FILES, 'process/config.json': { modules_file: 'build/modules.json', ...config }, ...files });
  openPassed(root);
  return root;
};

test('found: BOB\'s plain-PR act adds an unmet found mark to the module\'s requirement file, numbered per module', () => {
  const root = repo({}, { 'build/requirements/q2.md': `${unmet(0)}- **F1** struck: met by PR 9\n${F(2)}` });
  const out = [];
  const r = found(root, 'q2', '  founder sign-in\n answers HTTP 200 without a session ', { from: 'walk p3dev-l1', offline: true, log: (l) => out.push(l) });
  assert.equal(r.mark, 'F3', 'one past the highest F, met or not');
  assert.equal(r.file, 'build/requirements/q2.md');
  assert.equal(r.line, '- **F3** *(not yet met: walk p3dev-l1)* founder sign-in answers HTTP 200 without a session');
  const t = out.join('\n');
  assert.match(t, /found work for q2: F3 in build\/requirements\/q2\.md, the module's requirement file/);
  assert.match(t, /BOB's act, a plain pull request into tranche:\n1\. git switch -c found\/q2-f3 tranche/);
  assert.match(t, /\n {3}- \*\*F3\*\* \*\(not yet met: walk p3dev-l1\)\* founder sign-in/);
  assert.match(t, /merge <that pull request> --plain --no-review "work found elsewhere: one found mark, no code"/);
  // Numbered per module: another module starts at F1.
  assert.equal(found(root, 'base', 'x', { offline: true, log: quiet }).mark, 'F1');
  // --write appends the one line and changes nothing else (the diff merge --plain accepts); the next is F4.
  const before = readFileSync(join(root, 'build/requirements/q2.md'), 'utf8');
  found(root, 'q2', 'second finding', { from: 'walk p3dev-l1', write: true, offline: true, log: quiet });
  const text = readFileSync(join(root, 'build/requirements/q2.md'), 'utf8');
  assert.equal(text, `${before}- **F3** *(not yet met: walk p3dev-l1)* second finding\n`);
  assert.equal(found(root, 'q2', 'third', { offline: true, log: quiet }).mark, 'F4');
  assert.equal(found(root, 'q2', 'third', { offline: true, log: quiet }).line, '- **F4** *(not yet met: found)* third', 'default source');
});

test('found: with origin, two findings for one module before the first merges get two numbers: the checkout\'s copy and found/<module>-f<n> branches count', () => {
  const root = repo();
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // Printed, then written and pushed on its branch (BOB's steps 1 to 3): the next is F2.
  const one = found(root, 'q2', 'one', { log: quiet });
  assert.equal(one.mark, 'F1');
  const back = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', one.branch, 'tranche'], { cwd: root });
  found(root, 'q2', 'one', { write: true, log: quiet });
  git(['commit', '-qam', 'found: q2 F1'], { cwd: root });
  git(['push', '-q', 'origin', one.branch], { cwd: root });
  git(['checkout', '-q', back], { cwd: root });
  git(['branch', '-q', '-D', one.branch], { cwd: root });
  assert.equal(found(root, 'q2', 'two', { log: quiet }).mark, 'F2');
  // Written in the checkout (--write), not yet pushed: the next counts it too.
  assert.equal(found(root, 'q2', 'two', { write: true, log: quiet }).mark, 'F2');
  const third = found(root, 'q2', 'three', { write: true, log: quiet });
  assert.equal(third.mark, 'F3');
  assert.equal((readFileSync(join(root, 'build/requirements/q2.md'), 'utf8').match(/\*\*F2\*\*/g) || []).length, 1);
  // Another module's branches do not count.
  assert.equal(found(root, 'base', 'x', { log: quiet }).mark, 'F1');
});

test('found: a module with no requirement file gets a found-work entry; one that names no module goes to no-module; unknown modules and marks in the text are refused', () => {
  const root = repo();
  const out = [];
  const r = found(root, 'reader', 'ROLLOUT NOT CONFIRMED on reader-container', { from: 'deploy p3dev-l1', offline: true, log: (l) => out.push(l) });
  assert.equal(r.file, 'process/found/reader.md');
  assert.equal(r.mark, 'F1');
  assert.match(out.join('\n'), /its found-work entry, since the module has no requirement file \(build\/requirements\/reader\.md\)/);
  const n = found(root, null, 'LOGIN_FAILED: founder sign-in answers HTTP 200 without a session', { from: 'walk p3dev-l1', offline: true, log: quiet });
  assert.equal(n.file, NO_MODULE);
  assert.equal(n.branch, 'found/no-module-f1');
  assert.throws(() => found(root, 'nobody', 'x', { offline: true, log: quiet }), /nobody is not a module on the working tree .*found "<finding>" --from <source>/);
  assert.throws(() => found(root, 'q2', 'see **R2** *(not yet met', { offline: true, log: quiet }), /must not hold a mark/);
  assert.throws(() => found(root, 'q2', 'x', { from: 'walk (l1)', offline: true, log: quiet }), /parentheses/);
  assert.throws(() => found(root, 'q2', ' ', { offline: true, log: quiet }), /the finding must be text/);
});

test('found marks: parsed as unmet marks by the job and the cap, read back with their source', () => {
  const t = `${unmet(1)}${F(2)}- **F1** met\n`;
  assert.deepEqual(markedIds(t), ['R1', 'F2']);
  // The shared parser (util's requirementMarks) reads found marks, a parenthetical before the mark included.
  assert.deepEqual(requirementMarks('- **F4** (walk p3dev-l1) *(not yet met: walk)* x\n- **F3** met\n'), { all: ['F4', 'F3'], unmet: ['F4'] });
  assert.equal(nextFound(t), 3);
  assert.deepEqual(foundMarks(t), [{ id: 'F2', source: 'walk p3dev-l1', finding: 'founder sign-in answers HTTP 200 without a session' }]);
  assert.match(overCap({ requirements_cap: null, requirements_cap_marks: 1 }, 'f.md', t) || '', /2 unmet marks/);
  assert.equal(addFound(null, '- **F1** x', 'Found work for r'), '# Found work for r\n\n- **F1** x\n');
  assert.equal(addFound('# a\n', '- **F1** x', 't'), '# a\n- **F1** x\n');
  assert.throws(() => addFound('# a', '- **F1** x', 't'), /does not end in a newline/);
});

test('status: found work is next work as soon as its module is ready by open_by uses, whatever its layer, marked found; it never reopens or holds a layer', () => {
  // base (layer 1, closed with no unmet requirement marks) gets a walk finding; layer 2 is open.
  const root = repo({}, {
    'build/requirements/base.md': unmet(0) + F(1),
    'process/found/reader.md': `# Found work for reader\n\n## Found work\n\n${F(1, 'deploy p3dev-l1', 'ROLLOUT NOT CONFIRMED on reader-container')}`,
    [NO_MODULE]: `# Found work that names no module\n\n## Found work\n\n${F(1, 'walk p3dev-l1', 'LOGIN_FAILED')}`,
  });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 2, 'a found mark does not reopen a closed layer');
  const t = out.join('\n');
  assert.match(t, /next work, layer 2 .*\n- build\/requirements\/p2\.md: 2 \(layer 2\)\n/);
  // u3 (layer 3) is ready by its uses: owed to its layer, never started early (the coordinator's ruling, 6 Nov).
  assert.match(t, /owed to their own layers [^\n]*:\n- build\/requirements\/u3\.md: 1 \(layer 3\): owed to layer 3\n/);
  assert.match(t, /found work \(work found elsewhere, ready by open_by uses, whatever its layer;[^\n]*: all 2 listed\n/);
  assert.match(t, /\n- build\/requirements\/base\.md: 1 \(layer 1\); found F1\n/);
  assert.match(t, /- process\/found\/reader\.md: 1; found F1; no requirement file: BOB gives the module its requirement file and ledger entry/);
  // base has found work, so f4 (uses base) waits; u4 (uses p2, unmet) waits; x3 (no uses) waits for layer 3.
  assert.doesNotMatch(t, /(f4|u4|x3)\.md: /);
  assert.match(t, /found, no module \(process\/found\/no-module\.md; BOB's act: name its module with `node \.process\/tool\/p3\.mjs found <module> "<finding>" --from "<source>"`, deleting its line here in the same pull request\):\n- F1 \(walk p3dev-l1\): LOGIN_FAILED/);
  assert.ok(r.next.some((x) => x.found_no_module === 'F1'), 'BOB\'s act is counted as work');
  assert.deepEqual(r.next.filter((x) => x.found).map((x) => x.file).sort(), ['build/requirements/base.md', 'process/found/reader.md']);
  // base's found work done: f4 (layer 4) is ready by its uses: owed to layer 4, its found mark named.
  const later = repo({}, { 'process/found/reader.md': '# r\n' });
  const o2 = [];
  const r2 = status(later, { role: 'bob', offline: true, log: (m) => o2.push(m) });
  assert.match(o2.join('\n'), /- build\/requirements\/f4\.md: 1 \(layer 4\): owed to layer 4; found F1\n?/);
  assert.equal(r2.layer.cur.n, 2);
  // The open layer closes past found work: q2 with only a found mark does not hold layer 2's close.
  const q = repo({}, { 'build/requirements/p2.md': unmet(0), 'build/requirements/q2.md': unmet(0) + F(1) });
  const r3 = status(q, { role: 'bob', offline: true, log: quiet });
  assert.equal(r3.layer.cur.n, 3, 'layer 2 had no requirement marks: closed, its found work still listed');
  assert.ok(r3.next.some((x) => x.file === 'build/requirements/q2.md' && x.found), 'q2 listed as found work');
});

test('status: open_by layer lists found work of the open and closed layers only; an open job takes it off the list', () => {
  const root = repo({ open_by: 'layer' }, { 'build/requirements/base.md': unmet(0) + F(1) });
  const next = status(root, { role: 'bob', offline: true, log: quiet }).next;
  assert.deepEqual(next.filter((x) => x.found).map((x) => x.file), ['build/requirements/base.md']);
  const busy = repo({}, { 'build/requirements/base.md': unmet(0) + F(1), 'process/ledger/base.json': entry('base', { requirements: 'build/requirements/base.md' }) });
  assert.ok(!status(busy, { role: 'bob', offline: true, log: quiet }).next.some((x) => x.file === 'build/requirements/base.md'));
});

test('report tranche: found work in the record is counted, per module and with no module', () => {
  const root = makeRepo({ ...FILES, 'process/config.json': { modules_file: 'build/modules.json' }, [NO_MODULE]: `# n\n\n${F(1)}`, 'process/found/reader.md': `# r\n\n${F(1)}- **F2** met\n` });
  const md = trancheReport(root, loadConfig(root), { now: '2026-11-04T12:00:00Z', io: { merged: () => null } });
  assert.match(md, /## Found work\n/);
  assert.match(md, /Found marks 6; unmet 5;/);
  assert.match(md, /\| reader \| 2 \| F1 \|/);
  assert.match(md, /\| \(no module\) \| 1 \| F1 \|/);
  assert.match(md, /\| f4 \| 1 \| F1 \|/);
});

// Copy, 6 Nov: BOB previewed found op-capabilities (no --write), cut its branch as step 1 printed,
// and the --write run numbered the mark F2; PR 664 renumbered it by hand.
test('found: a preview\'s branch, cut as step 1 prints it with nothing written, is the same mark, local or pushed: the --write run keeps F1', () => {
  const root = repo();
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const preview = found(root, 'q2', 'one', { log: quiet });
  assert.equal(preview.mark, 'F1');
  git(['switch', '-q', '-c', preview.branch, 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'one', { log: quiet }).mark, 'F1', 'the local branch holds nothing written');
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  const w = found(root, 'q2', 'one', { write: true, log: quiet });
  assert.deepEqual([w.mark, w.branch], ['F1', preview.branch], 'pushed with nothing written: still the same mark');
  assert.match(readFileSync(join(root, 'build/requirements/q2.md'), 'utf8'), /\*\*F1\*\* \*\(not yet met: [^)]*\)\* one/);
  // Once committed there, it is written: another finding is F2.
  git(['commit', '-qam', 'found: q2 F1'], { cwd: root });
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  git(['switch', '-q', 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'two', { log: quiet }).mark, 'F2');
});

// ===== file: lane-qualify.test.mjs =====

// Lane qualification (SES-14; Bob, 6 Nov): "a lane is fully qualified to fulfill their role as the
// load-bearing source of truth in their area. So the first time a lane is defined and run, it
// should start by using workers to fully research canon documents, existing code, and best
// practices related to their specialty area. This initial and ongoing research should be recording
// in a lane-specific area of the product repo for subsequent sessions to draw from and evolve."
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { startText } from '../lib/job.mjs';
import { LANES_FILE, laneAsk, laneEnd, laneForStart, laneStart, lanes, qualification } from '../lib/lane.mjs';
import { git, laneDirs, laneOfPath, laneOnly, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const S1 = 'session_q1';
function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const asksOn = (bare) => git(['show', `process-state:${LANES_FILE}`], { cwd: bare, allowFail: true }).stdout;

test('a lane\'s research area: the sibling <dir>-research by default, or its "research"; never inside or around dir, a generated path, or a governed folder; none for a triage lane', () => {
  assert.equal(lanes({ lanes: [{ name: 'ux', dir: 'docs/ux-substrate/' }] })[0].research, 'docs/ux-substrate-research');
  assert.equal(lanes({ lanes: [{ name: 'ux', dir: 'docs/ux', research: './docs/lanes/ux-research/' }] })[0].research, 'docs/lanes/ux-research');
  for (const research of ['docs/ux/research', 'docs', 'process/ux', '.github/r', '../r', '.']) assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'docs/ux', research }] }), /cannot be its research area/, research);
  assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'docs/ux', research: '' }] }), /research is a folder in the product/);
  assert.throws(() => lanes({ generated: [{ paths: ['docs/ux-research/big.json'] }], lanes: [{ name: 'ux', dir: 'docs/ux' }] }), /holds the generated path docs\/ux-research\/big\.json: research is never what the build reads/);
  assert.throws(() => lanes({ lanes: [{ name: 't', dir: 'triage', kind: 'triage', research: 'r' }] }), /triage lane: its register is its record/);
  assert.equal(lanes({ lanes: [{ name: 't', dir: 'triage', kind: 'triage' }] })[0].research, null);
  assert.equal(laneDirs({ lanes: [{ name: 't', dir: 'triage', kind: 'triage' }] })[0].research, null);
  // Review: only a folder named research or *-research; never a source folder or a root build file.
  for (const research of ['src', 'package.json', 'docs/researcher']) assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'docs/ux', research }] }), /cannot be its research area/, research);
  assert.equal(lanes({ lanes: [{ name: 'ux', dir: 'docs/ux', research: 'notes/research' }] })[0].research, 'notes/research');
  assert.throws(() => lanes({ lanes: [{ name: 'ux', research: 'docs/ux-research' }] }), /sets research but no dir/);
  // Nor another lane's folders, either way round.
  assert.throws(() => lanes({ lanes: [{ name: 'a', dir: 'ui' }, { name: 'b', dir: 'ui-research' }] }), /overlaps another lane's dir or research/);
  assert.throws(() => lanes({ lanes: [{ name: 'a', dir: 'docs', research: 'other-research' }, { name: 'b', dir: 'other-research/x' }] }), /overlaps another lane's/);
  // The gate (laneDirs alone, from the base config) drops what lanes() refuses, never widens.
  assert.deepEqual(laneDirs({ lanes: [{ name: 'a', dir: 'ui' }, { name: 'b', dir: 'ui-research' }] }).map((x) => x.research), [null, 'ui-research-research']);
  assert.equal(laneDirs({ lanes: [{ name: 'a', dir: 'ui', research: 'src' }] })[0].research, null);
  assert.equal(laneDirs({ lanes: [{ name: 'a', dir: 'ui', kind: 'Triage' }] })[0].research, null);
  assert.equal(laneDirs({ lanes: [{ name: 'a', dir: 'ui', research: ['src'] }] })[0].research, null);
});

test('the gate counts the research area as the lane\'s own folder: a pull request changing only it (and the lane\'s dir) takes the lane-only path', () => {
  const cfg = { records: [], lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux' }, { name: 'ai', dir: 'design/ai', research: 'notes/ai-research' }] };
  assert.equal(laneOfPath(cfg, 'design/ux-research/index.md'), 'ux');
  assert.equal(laneOfPath(cfg, 'notes/ai-research/qualification-2026-11-06.md'), 'ai');
  assert.equal(laneOfPath(cfg, 'design/ai-research/x.md'), null);
  assert.equal(laneOnly(cfg, ['design/ux/a.md', 'design/ux-research/index.md']), 'ux');
  assert.equal(laneOnly(cfg, ['design/ux-research/index.md', 'notes/ai-research/index.md']), null);
  // A research file another module's paths name is that module's, judged as today.
  assert.equal(laneOfPath(cfg, 'design/ux-research/x.md', [entry('other', { paths: ['design/ux-research/'] })]), null);
  assert.equal(laneOfPath(cfg, 'design/ux-research/.github/x.yml'), null);
  // A triage lane's sibling is no lane path; nor is one under an invalid dir; overlapping lanes stay two.
  assert.equal(laneOfPath({ records: [], lanes: [{ name: 't', dir: 'triage', kind: 'triage' }] }, 'triage-research/x.md'), null);
  assert.equal(laneOfPath({ records: [], lanes: [{ name: 'p', dir: 'process/ux' }] }, 'process/ux-research/x.md'), null);
  const two = { records: [], lanes: [{ name: 'a', dir: 'ui' }, { name: 'b', dir: 'ui-research' }] };
  assert.equal(laneOfPath(two, 'ui-research/x.md'), 'b');
  assert.equal(laneOnly(two, ['ui/a.md', 'ui-research/x.md']), null);
});

test('qualification: index and records must be files; an unreadable research area reads as not qualified; a folder already there that is not research is refused', async () => {
  const { mkdirSync, symlinkSync } = await import('node:fs');
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/a.md': 'a\n', 'design/ux-research/x/keep.md': 'k\n' });
  const l = lanes(loadConfig(root))[0];
  mkdirSync(join(root, 'design/ux-research/index.md'));
  mkdirSync(join(root, 'design/ux-research/qualification-2026-11-06.md'));
  const q = qualification(root, l);
  assert.deepEqual([q.index, q.records.length, q.qualified], [false, 0, false]);
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /research folder design\/ux-research\/ already holds \d+ file\(s\), and neither index\.md nor a qualification record: it is not the lane's research/);
  symlinkSync(join(root, 'nowhere'), join(root, 'design/ux-research/broken'));
  assert.equal(qualification(root, l).qualified, false);
  });

test('lane start on a lane with no qualification record prints the QUALIFICATION brief; once its index and dated record are in, the research area leads the START', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  const out = [];
  const r = laneStart(root, 'ux', { slug: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.qualified, false);
  assert.match(r.prompt, /## QUALIFICATION: your first work \(Bob, 6 Nov\)/);
  assert.match(r.prompt, /This lane has not qualified \(design\/ux-research\/ is missing or empty\)\. A lane is the load-bearing source of truth in its area, so it is qualified for that before it decides anything/);
  assert.match(r.prompt, /Use workers \(subagents/);
  assert.match(r.prompt, /1\. The canon: the Process3 Foundations .*the product's principles and its docs, and the requirement files of the modules your area serves/);
  assert.match(r.prompt, /2\. The existing code in your area: `design\/ux\/` whole/);
  assert.match(r.prompt, /3\. Best practice in your specialty/);
  assert.match(r.prompt, /`index\.md` .*`qualification-<YYYY-MM-DD>\.md`, the dated record/);
  assert.match(r.prompt, /one pull request that changes only `design\/ux-research\/`: the lane-only path, no suite run/);
  assert.match(out.join('\n'), /lane ux has not qualified .*the START above is its QUALIFICATION brief; lane ask refuses its questions until the qualification pull request is in tranche/);
  assert.ok(Buffer.byteLength(r.prompt) <= 6144, `${Buffer.byteLength(r.prompt)} bytes`);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });

  // An index alone is not a qualification.
  commit(root, { 'design/ux-research/index.md': 'index\n' });
  assert.match(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).prompt, /not qualified \(design\/ux-research\/ holds no qualification-<YYYY-MM-DD>\.md\)/);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });
  // A record without its index neither.
  const noIndex = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', 'design/ux-research/qualification-2026-11-06.md': 'r\n' });
  assert.match(laneStart(noIndex.root, 'ux', { slug: 'o/p', log: quiet }).prompt, /not qualified \(design\/ux-research\/index\.md is missing\)/);

  commit(root, { 'design/ux-research/qualification-2026-11-06.md': 'record\n', 'design/ux-research/canon.md': 'canon\n' });
