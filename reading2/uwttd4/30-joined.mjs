// ===== file: tranche.test.mjs (continued) =====

  const text = out.join('\n');
  assert.equal(o.n, 2);
  assert.equal(o.base, 'p3/grants-tranche-2');
  assert.match(text, /^tranche open: 0 of 12 acts recorded/m);
  assert.match(text, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-bob --set-upstream`; then node \.process\/tool\/p3\.mjs tranche open --record "push\|1\|<ok, refused or declined>"/);
  assert.match(text, /pr-merge: `node \.process\/tool\/p3\.mjs merge <that pull request> --plain --no-review/);
  assert.match(text, /task-delete: delete_trigger/);
  assert.equal(o.call.clone_depth, 1);
  assert.equal(o.call.source_revision, git(['rev-parse', 'tranche'], { cwd: root }));
  assert.match(o.call.prompt, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-probe --set-upstream`/);
  assert.match(o.call.prompt, /"<act>\|2\|<ok, refused or declined>"/);

  assert.throws(() => recordOpen(root, ['push|1|ok'], { log: quiet }), /--session/);
  assert.throws(() => recordOpen(root, ['fly|1|ok'], { session: 'b', log: quiet }), /the act one of/);
  assert.throws(() => recordOpen(root, ['push|1|maybe'], { session: 'b', log: quiet }), /<ok, refused or declined>/);
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  const first = [];
  recordOpen(root, acts.map((a) => `${a}|1|ok`), { session: 'bob', as: 'coordinator', log: (m) => first.push(m) });
  assert.doesNotMatch(first.join('\n'), /wake BOB/, 'not yet passed: no wake');
  const pend = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => pend.push(m) }).state, 'pending');
  assert.doesNotMatch(pend.join('\n'), /wake BOB/);
  recordOpen(root, ['push|2|ok', 'pr-open|2|ok', 'pr-comment|2|ok'], { session: 'probe', log: quiet });
  recordOpen(root, ['pr-merge|2|refused'], { session: 'probe', log: quiet });
  const c = [];
  assert.equal(checkOpen(root, { log: (m) => c.push(m) }).state, 'stopped');
  assert.match(c.join('\n'), /STOPPED: pr-merge at depth 2 refused \(probe\)/);
  // The refusal is also metrics refusal's row, so it counts toward REFRESH.
  const ref = JSON.parse(readFileSync(join(root, REFUSALS_FILE), 'utf8').trim());
  assert.deepEqual([ref.session, ref.act, ref.depth], ['probe', 'tranche open: pr-merge', 2]);
  assert.equal(git(['show', `process-state:${OPEN_FILE}`], { cwd: bare }).split('\n').length, 12);
  // Stopped, open prints no acts.
  assert.deepEqual(trancheOpen(root, { slug, log: quiet }).steps, []);
  assert.throws(() => recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', log: quiet }), /pr-merge at depth 2 stopped this open; an ok after it needs --bob/);
  const pass = [];
  recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', bob: 'grant fixed, take it again', as: 'coordinator', log: (m) => pass.push(m) });
  // The record that passes the open lets jobs start: its last line wakes BOB, as --check's does.
  const wake = 'next act: wake BOB with `node .process/tool/p3.mjs send bob "tranche open passed: run status" --from coordinator`, delivered with send_message to the address it prints';
  assert.equal(pass.at(-1), wake);
  const ok = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => ok.push(m) }).state, 'open');
  assert.equal(ok.at(-1), wake);
  // BOB checking (the default sender) is awake: no wake.
  const own = [];
  checkOpen(root, { log: (m) => own.push(m) });
  assert.doesNotMatch(own.join('\n'), /wake BOB/);
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const io = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } };

test('tranche close: refused while a layer is open; the acts merge main in only when it is not in the tranche; --record once on main', () => {
  const open = withOrigin({ 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(1), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }) });
  assert.throws(() => trancheClose(open.root, { slug, io, log: quiet }), /layers not closed: 1/);

  const files = { 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(0), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  const { root, bare } = withOrigin(files);
  const out = [];
  trancheClose(root, { slug, io, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /is already in tranche: no merge of main into it/);
  assert.doesNotMatch(out.join('\n'), /"head":"main"/);
  assert.match(out.join('\n'), /create_pull_request \{"owner":"o","repo":"p","head":"tranche","base":"main"/);
  assert.match(out.join('\n'), /tranche close --record/);

  // main moved: its merge into the tranche comes first.
  git(['checkout', '-q', 'main'], { cwd: root });
  commit(root, { 'NOTE.md': 'owner edit\n' });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'WORK.md': 'tranche work\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const two = [];
  const r = trancheClose(root, { slug, io, log: (m) => two.push(m) });
  assert.match(r.steps[0], /"head":"main","base":"tranche"/);
  assert.match(r.steps[1], /merge <that pull request> --plain --no-review "main into the tranche/);

  // --record: refused until the tranche is on main, then one row; not twice.
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /not on main yet/);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const rec = [];
  const done = trancheClose(root, { slug, io, record: true, report: true, log: (m) => rec.push(m) });
  const row = JSON.parse(git(['show', `process-state:${TRANCHE_CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.equal(row.main, git(['rev-parse', 'main'], { cwd: bare }));
  assert.equal(done.row.tranche, 'tranche');
  assert.match(rec.join('\n'), /next: node \.process\/tool\/p3\.mjs report tranche/);
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /already recorded/);
  // The plan says close: no layer check.
  commit(open.root, { 'process/config.json': { plan: 'close' } });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: open.root });
  assert.ok(trancheClose(open.root, { slug, io, log: quiet }).steps.length >= 3);
});

test('a close starts a new open: grant rows before the tranche\'s last close do not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, [...acts.map((a) => `${a}|1|ok`)], { session: 'bob', log: quiet });
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|2|ok`), { session: 'probe', log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'open');
  trancheClose(root, { slug, io, record: true, log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'pending');
});

test('BOB at depth 2: status reads its depth from the rows; --record refuses an act the check does not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, acts.map((a) => `${a}|2|ok`), { session: 'bob', log: quiet });
  assert.throws(() => recordOpen(root, ['session-start|3|ok'], { session: 'probe', log: quiet }), /not an act of this check .*session-start at depth 3; nothing recorded/);
  assert.throws(() => recordOpen(root, ['push|4|refused'], { session: 'probe', log: quiet }), /push at depth 4/);
  assert.throws(() => existsSync(join(root, REFUSALS_FILE)) || (() => { throw new Error('none'); })(), /none/);
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|3|ok`), { session: 'probe', log: quiet });
  const s = status(root, { role: 'bob', offline: true, log: quiet });
  assert.equal(s.open.state, 'open');
  assert.equal(s.open.depth, 2);
});

// ===== file: shims.test.mjs =====

// Build product-shims (TXT-1, SHM-1, SHM-5): the process lines a product's CLAUDE.md carries, the
// drift check of its shims and hooks against the pin, and the setup script start check runs.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { approvalsBlock } from '../lib/record.mjs';
import { MAX_LINES, pinOf, setupCheck } from '../lib/setup.mjs';
import { runSetupScript, setupMarker, startCheck } from '../lib/start.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const raw = (f) => readFileSync(join(SHIMS, f), 'utf8');
const strip = (t) => t.replace(/\n$/, '');
const PIN = { sha: 'p'.repeat(40), file: (f) => (f.startsWith('shims/') && existsSync(join(SHIMS, f.slice(6))) ? strip(raw(f.slice(6))) : null), list: () => readdirSync(SHIMS) };
const LINES = raw('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
const HOOKS = JSON.parse(raw('settings.hooks.json')).hooks;
const APPROVALS = '## Standing approvals from Bob\n\nThe owner\'s words.\n';
const FETCH = 'git fetch origin tranche --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process';

// Only the two shim conditions are judged; the rest of the setup is another test's.
function files(over = {}) {
  return {
    'CLAUDE.md': `${APPROVALS}\n${LINES}`,
    '.claude/settings.json': JSON.stringify({ permissions: { deny: [] }, hooks: HOOKS }),
    '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml'),
    '.github/workflows/process-record.yml': PIN.file('shims/process-record.yml'),
    '.github/workflows/process-branch-prune.yml': PIN.file('shims/process-branch-prune.yml'),
    'process/config.json': JSON.stringify({ tranche: 'tranche' }),
    ...over,
  };
}
const only = (ids) => ({ conditions: ids.map((id) => ({ id, read: 'x' })) });
const judge = (f, pin = PIN) => {
  const r = setupCheck(makeRepo({ 'README.md': 'x' }), { slug: 'o/r', io: { api: () => null, env: {}, file: (p) => f[p] ?? null, pin }, ...only(['process-lines', 'shim-drift']), log: quiet });
  return Object.fromEntries(r.results.map((x) => [x.id, x]));
};

test('the shim: the pin, the one fetch command, where the role prompt comes from, under its own heading', () => {
  const lines = raw('CLAUDE.process.md').trimEnd().split('\n');
  assert.equal(lines[0], '## Process3');
  assert.ok(lines.some((l) => l.includes('`git ls-tree HEAD .process`')));
  assert.ok(lines.some((l) => l.includes('`git fetch origin {tranche} --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process`')));
  assert.ok(lines.some((l) => /role prompt/.test(l)));
  // A product's whole CLAUDE.md: the approvals, then these lines, which end the approvals block.
  const md = `${APPROVALS}\n${LINES}`;
  assert.equal(approvalsBlock(md, '## Standing approvals from Bob'), APPROVALS.trim());
  assert.ok(md.includes(FETCH));
  assert.ok(lines.length < MAX_LINES);
});

test('process-lines: set with the lines exactly; each gap names the plain pull request BOB makes', () => {
  assert.equal(judge(files())['process-lines'].state, 'set');
  assert.match(judge(files())['process-lines'].detail, /the process lines of the pin pppppppppp, \d+ lines besides the approvals/);
