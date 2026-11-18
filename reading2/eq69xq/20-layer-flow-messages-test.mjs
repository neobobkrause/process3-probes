// Messages in the shared layer branch's flow, the only flow since the merge train was removed (Bob,
// 6 Nov): no MERGER, no train, no job start --ready; each message says what is true here.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { layerLines, layerMergeLine, layerOpen, layerStartAct, openLayer, writeRows } from '../lib/layerflow.mjs';
import { flowFile } from '../lib/layerbase.mjs';
import { recordStart } from '../lib/roles.mjs';
import { laneModuleCheck, setupCheck, strategyCheck } from '../lib/setup.mjs';
import { fetchState, readState, writeState } from '../lib/state.mjs';
import { nextWork, status } from '../lib/status.mjs';
import { OWED_FILE, owe, owes, paidUpTo, paysOwed, readOwed } from '../lib/hold.mjs';
import { layerIdle, sweep } from '../lib/sweep.mjs';
import { configOf, git } from '../lib/util.mjs';
import { checkRow } from '../lib/gate.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const R = 'session_root1';
const B = 'session_bob1';
const OLD = '2026-01-01T00:00:00Z';
const P3 = 'node .process/tool/p3.mjs';

function withOrigin(files) {
  const root = makeRepo({ 'README.md': 'x', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}

// A product in the layer flow: modules a, b in layer 1 (unmet marks), d in layer 2.
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | d |\n';
const REQ = '# x\n\n**R1** a requirement *(not yet met: T1)*\n';
function product({ complete = false } = {}) {
  const files = { 'process/config.json': { tranche: 'tranche', merge_strategy: 'layer' }, 'build/layers.md': LAYERS };
  for (const id of ['a', 'b', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { requirements: `build/requirements/${id}.md`, ...(complete ? { status: { state: 'COMPLETE' } } : {}) });
    files[`build/requirements/${id}.md`] = REQ;
  }
  return withOrigin(files);
}
const openIO = { slug: 'o/p', openPRs: () => [] };

const view = (over = {}) => ({ kind: 'open', n: 3, states: [{ id: 'a', state: 'working' }, { id: 'b', state: 'not started' }], prs: [], startable: [{ id: 'b', cmd: `${P3} job start b --sessions <file>` }], ready: false, ...over });

test('layer flow helpers: the merge line only when every module is complete or deferred; the act owed', () => {
  assert.equal(layerMergeLine(view()), null);
  const done = view({ states: [{ id: 'a', state: 'complete' }, { id: 'b', state: 'deferred' }], startable: [], ready: true });
  assert.equal(layerMergeLine(done), `layer 3: complete 1, deferred 1, published 0, working 0, rescheduled 0, not started 0; merge when every module is complete or deferred (${P3} layer merge 3)`);
  // The act owed: start, merge, open the next; unread, status.
  assert.equal(layerStartAct(view()), `${P3} layer jobs 3, then each job start it lists`);
  assert.equal(layerStartAct(done), `${P3} layer merge 3`);
  assert.equal(layerStartAct({ kind: 'next', n: 4 }), `${P3} layer open 4`);
  assert.match(layerStartAct(null), /status --role bob/);
});

test('openLayer: the next layer before its open; once open, its startable jobs and no merge', () => {
  const root = product();
  const cfg = configOf({ tranche: 'tranche', merge_strategy: 'layer' });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(openLayer(root, cfg, { slug: 'o/p', io: openIO }), { kind: 'next', n: 1 });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const v = openLayer(root, cfg, { slug: 'o/p', io: openIO });
  assert.equal(v.kind, 'open');
  assert.deepEqual(v.startable.map((x) => x.id), ['a', 'b']);
  assert.equal(v.ready, false);
  assert.equal(layerMergeLine(v), null);
  // The merge line is next work's in status: layerLines leaves it out with merge false.
  const ready = { ...v, startable: [], ready: true };
  assert.ok(layerLines(root, cfg, { view: ready }).some((l) => /can merge/.test(l)));
  assert.ok(!layerLines(root, cfg, { view: ready, merge: false }).some((l) => /can merge/.test(l)));
});

test('next work: no train-era "ready to close" line; the layer\'s merge line only when it holds', () => {
  const cfg = configOf({ tranche: 'tranche' });
  const ls = { ready: true, pending: true, cur: { n: 1, mods: [] }, layers: [], deferred: [], owed: [{ pr: 9, blocked: 'x' }] };
  const lines = (v) => { const out = []; nextWork(product(), cfg, [], null, { state: ls, view: v, log: (l) => out.push(l) }); return out; };
  const working = lines(view());
  assert.ok(!working.some((l) => /ready to close|merge when|layer close|job start --ready/.test(l)), working.join('\n'));
  const done = view({ states: [{ id: 'a', state: 'complete' }], startable: [], ready: true });
  assert.ok(lines(done).includes(layerMergeLine(done)));
  assert.ok(!lines(null).some((l) => /ready to close/.test(l)));
});

test('idle capacity: slots count against the open layer\'s startable jobs, never the train or a layer close', () => {
  const t = Date.parse('2026-11-06T12:00:00Z');
  const prev = { at: '2026-11-06T11:00:00Z', idle_capacity: { kind: 'work', since: '2026-11-06T11:00:00Z' } };
  const ic = layerIdle({ live: 2, cap: 6, holds: [], view: view({ startable: [{ id: 'b', cmd: 'x' }, { id: 'c', cmd: 'y' }] }), prev, t });
  assert.equal(ic.kind, 'work');
  assert.equal(ic.alarm, true);
  assert.equal(ic.startable, 2);
  assert.deepEqual(ic.reasons, [`2 x startable from ${P3} layer jobs 3, not started (start now: b, c; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits)`, '2 x no startable work: layer 3 lists no job to start']);
  assert.deepEqual(ic.fill, ['b', 'c']);
  assert.ok(!ic.reasons.some((r) => /ready to close|job start --ready|train/.test(r)));
  // A module hold on a startable job: named; a hold of another layer's module: nothing.
  const holds = [{ live: true, kind: 'module', value: 'b', id: 'h1', by: 'bob', why: 'waits' }, { live: true, kind: 'module', value: 'zz', id: 'h2', by: 'bob', why: 'other' }];
  // Every listed job working or held, nothing to merge: the layer's own wait, no idle.
  assert.equal(layerIdle({ live: 2, cap: 6, holds, view: view(), prev, t }), null);
  const h = layerIdle({ live: 1, cap: 6, holds, view: view({ startable: [{ id: 'b', cmd: 'x' }, { id: 'c', cmd: 'y' }] }), prev, t });
  assert.equal(h.startable, 1);
  assert.deepEqual(h.reasons, [`1 x startable from ${P3} layer jobs 3, not started (start now: c; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits)`, 'b: held by h1 (by bob): waits', '3 x no startable work: layer 3 lists no job to start']);
  // The layer can merge, or the next is not open: said as the empty slots' reason.
  assert.match(layerIdle({ live: 0, cap: 4, view: view({ startable: [], ready: true }), t }).reasons[0], /^4 x no startable work: layer 3 can merge \(.*layer merge 3\)$/);
  assert.match(layerIdle({ live: 0, cap: 4, view: { kind: 'next', n: 4 }, t }).reasons[0], /layer 4 is next and not open/);
  // Full: none.
  assert.equal(layerIdle({ live: 6, cap: 6, view: view(), t }), null);
});

// C25 (the coordinator, 7 Nov): on the copy's layer 11 IDLE CAPACITY ran 141 min while BOB held jobs
// listed "(after <provider>)" as waits. The alarm names the jobs that fill the empty slots, says an
// early start is BOB's now, and counts no additive retest (CI's, no job session) as a slot's work.
test('idle capacity (C25): the jobs that fill the empty slots are named, early ones included; a retest fills no slot', () => {
  const t = Date.parse('2026-11-07T18:37:00Z');
  const v = view({ startable: [{ id: 'a', cmd: `${P3} job start a --sessions <file>` }, { id: 'r', cmd: `${P3} layer retest r`, job: 'x', additive: true }, { id: 'b', cmd: `${P3} job start b --sessions <file>`, after: ['q'] }, { id: 'c', cmd: `${P3} job start c --sessions <file>`, after: ['q'] }] });
  const ic = layerIdle({ live: 4, cap: 6, view: v, t });
  assert.equal(ic.startable, 3, 'the retest is not counted');
  assert.deepEqual(ic.fill, ['a', 'b'], 'two empty slots: the first two in the list, the early b among them');
  assert.match(ic.reasons[0], /^2 x startable from .* layer jobs 3, not started \(start now: a, b; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits\)$/);
  // Only retests listed: no idle capacity (they need no session).
  assert.equal(layerIdle({ live: 4, cap: 6, view: view({ startable: [{ id: 'r', cmd: `${P3} layer retest r`, job: 'x', additive: true }] }), t }), null);
});

const run = (root, o = {}) => sweep(root, { session: R, offline: true, log: quiet, ...o });
function lapsedMerger(root) {
  writeState(root, SB, 'merger', (d) => {
    mkdirSync(join(d, 'addresses'), { recursive: true });
    writeFileSync(join(d, 'addresses/merger.json'), JSON.stringify({ session: 'session_merger1', at: OLD }));
    mkdirSync(join(d, 'merger'), { recursive: true });
    writeFileSync(join(d, 'merger/lease.json'), JSON.stringify({ session: 'session_merger1', token: 't', expires: OLD }));
  });
}

test('sweep: no MERGER is started or replaced, a stale merge_train key and an old MERGER address and lease on the state branch included', () => {
  const root = withOrigin({ 'process/config.json': { tranche: 'tranche', merge_train: true } });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  assert.ok(!run(root).todo.some((x) => /MERGER/.test(x)));
  lapsedMerger(root);
  const r = run(root);
  assert.ok(!r.todo.some((x) => /MERGER/.test(x)), r.todo.join('\n'));
  assert.ok(!r.found.some((x) => /MERGER/.test(x)), r.found.join('\n'));
});

test('sweep: a layer the train called ready to close is not said, and BOB is not told to run job start --ready', () => {
  const layers = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n';
  const files = () => ({
    'process/config.json': { tranche: 'tranche' },
    'build/layers.md': layers,
    'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n',
    'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n',
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }),
  });
  const root = withOrigin(files());
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  assert.doesNotMatch(s.found.join('; '), /ready to close/);
  assert.ok(!s.todo.some((x) => /job start --ready/.test(x)), s.todo.join('\n'));
});

test('setup check: the state branch\'s coordinator address is shown, the config\'s value flagged stale when it differs', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const conditions = [{ id: 'coordinator', what: 'the coordinator' }];
  const detail = (cfg, address) => setupCheck(root, { slug: 'o/r', conditions, io: { file: (f) => (f === 'process/config.json' ? JSON.stringify(cfg) : null), address: address === undefined ? null : () => address, pin: null, entries: [], api: () => null }, log: quiet }).results[0];
  assert.deepEqual(detail({ coordinator: 'session_old' }), { id: 'coordinator', what: 'the coordinator', state: 'set', detail: 'session_old' });
  assert.equal(detail({ coordinator: 'session_old' }, 'session_new').detail, "session_new (the state branch's address); process/config.json's coordinator session_old is stale");
  assert.equal(detail({ coordinator: 'session_new' }, 'session_new').detail, "session_new (the state branch's address, as process/config.json names)");
  assert.equal(detail({}, 'session_new').state, 'set');
