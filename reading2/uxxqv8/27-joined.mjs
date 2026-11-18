// ===== file: sweep-sessions.test.mjs (continued) =====

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


// ===== file: report.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, entry, makeRepo } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { deepen, span, trancheReport } from '../lib/report.mjs';

const LAYERS = '| Layer | Modules |\n|---|---|\n| 1 | `a`, `b` |\n| 2 | c |\n';
const req = (...ids) => `# x\n\n${ids.map(([id, met]) => `- **${id}**${met ? '' : ' *(not yet met: x)*'} text`).join('\n')}\n`;
const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const NOW = '2099-01-01T00:00:00.000Z';
const at = (h) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();
// The tranche's opening, as lead times reads it: its first ok grant row, on the state branch.
const OPEN = '2026-11-01T00:30:00.000Z';
const grants = jl({ row: 'grant', tranche: 'tranche', at: OPEN, act: 'push', depth: 1, outcome: 'ok' });

function fixture() {
  const root = makeRepo({
    'build/layers.md': LAYERS,
    'build/requirements/a.md': req(['R1'], ['R2']),
    'build/requirements/b.md': req(['R1'], ['R2', true]),
    'build/requirements/c.md': req(['R1']),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  process.env.GIT_COMMITTER_DATE = '2026-11-01T10:00:00+02:00'; // the tranche opens at 08:00Z
  commit(root, { 'src/a/x.js': 'x\n', 'build/requirements/a.md': req(['R1', true], ['R2']) }, 'code');
  commit(root, {
    'process/metrics/a.jsonl': jl(
      { at: at(1), module: 'a', row: 'attempt', event: 'start', attempt: 1 },
      { at: at(3), module: 'a', row: 'merge', pr: 11 },
    ),
    'process/metrics/a.bob.jsonl': jl({ at: at(2), module: 'a', row: 'attempt', event: 'measured', role: 'job', session: 's_a', cost_usd: 4 }),
    'process/metrics/b.jsonl': jl({ at: at(1), module: 'b', row: 'attempt', event: 'start', attempt: 1 }),
